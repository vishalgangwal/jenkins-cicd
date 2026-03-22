/* ===========================
   TASKFLOW — FRONTEND APP
   =========================== */

const API = '/api';
let allTodos = [];
let currentFilter = 'all';
let currentPriority = null;
let currentSort = '-createdAt';
let searchQuery = '';
let searchTimer = null;

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  fetchTodos();
  fetchStats();
  // Auto-refresh stats every 30s
  setInterval(fetchStats, 30000);
});

// ========== API HELPERS ==========
async function api(method, path, body) {
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Request failed');
    }
    return await res.json();
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
}

// ========== FETCH & RENDER ==========
async function fetchTodos() {
  const params = new URLSearchParams();
  if (currentFilter === 'completed') params.set('completed', 'true');
  if (currentFilter === 'active')    params.set('completed', 'false');
  if (currentPriority)               params.set('priority', currentPriority);
  if (searchQuery)                   params.set('search', searchQuery);
  params.set('sort', currentSort);
  params.set('limit', '100');

  try {
    const data = await api('GET', `/todos?${params}`);
    allTodos = data.todos;
    renderTodos(allTodos);
    updateCounts();
  } catch (_) {}
}

function renderTodos(todos) {
  const list = document.getElementById('todoList');
  const empty = document.getElementById('emptyState');
  const clearBtn = document.getElementById('clearBtn');

  // Remove existing todo items (keep empty state)
  list.querySelectorAll('.todo-item').forEach(el => el.remove());

  const filtered = currentFilter === 'overdue'
    ? todos.filter(t => !t.completed && t.dueDate && new Date() > new Date(t.dueDate))
    : todos;

  document.getElementById('taskCount').textContent = `${filtered.length} task${filtered.length !== 1 ? 's' : ''}`;

  const hasCompleted = todos.some(t => t.completed);
  clearBtn.style.display = hasCompleted ? 'block' : 'none';

  if (filtered.length === 0) {
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  filtered.forEach(todo => {
    const el = createTodoEl(todo);
    list.appendChild(el);
  });
}

function createTodoEl(todo) {
  const isOverdue = !todo.completed && todo.dueDate && new Date() > new Date(todo.dueDate);
  const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;

  const el = document.createElement('div');
  el.className = `todo-item priority-${todo.priority}${todo.completed ? ' done' : ''}`;
  el.dataset.id = todo._id;

  el.innerHTML = `
    <div class="todo-check ${todo.completed ? 'checked' : ''}" onclick="toggleTodo('${todo._id}', event)">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <div class="todo-body">
      <div class="todo-title">${escHtml(todo.title)}</div>
      ${todo.description ? `<div class="todo-desc">${escHtml(todo.description)}</div>` : ''}
      <div class="todo-meta">
        <span class="todo-badge badge-${todo.priority}">${capitalize(todo.priority)}</span>
        ${todo.category && todo.category !== 'General' ? `<span class="todo-badge badge-cat">${escHtml(todo.category)}</span>` : ''}
        ${isOverdue ? `<span class="todo-badge badge-overdue">⚠ Overdue</span>` : ''}
        ${(todo.tags || []).map(t => `<span class="todo-tag">#${escHtml(t)}</span>`).join('')}
        ${dueDate ? `
          <span class="todo-date ${isOverdue ? 'overdue' : ''}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${formatDate(dueDate)}
          </span>` : ''}
      </div>
    </div>
    <div class="todo-actions">
      <button class="action-btn" onclick="editTodo('${todo._id}', event)" title="Edit">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="action-btn delete" onclick="deleteTodo('${todo._id}', event)" title="Delete">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>
  `;
  return el;
}

// ========== STATS ==========
async function fetchStats() {
  try {
    const s = await api('GET', '/stats');
    document.getElementById('stat-total').textContent = s.total;
    document.getElementById('stat-completed').textContent = s.completed;
    document.getElementById('stat-pending').textContent = s.pending;
    document.getElementById('stat-rate').textContent = `${s.completionRate}%`;
    document.getElementById('progressFill').style.width = `${s.completionRate}%`;

    // Update sidebar counts
    document.getElementById('count-all').textContent = s.total;
    document.getElementById('count-active').textContent = s.pending;
    document.getElementById('count-completed').textContent = s.completed;
    document.getElementById('count-overdue').textContent = s.overdue || 0;
  } catch (_) {}
}

function updateCounts() {
  const total = allTodos.length;
  const completed = allTodos.filter(t => t.completed).length;
  const overdue = allTodos.filter(t => !t.completed && t.dueDate && new Date() > new Date(t.dueDate)).length;
  document.getElementById('count-all').textContent = total;
  document.getElementById('count-active').textContent = total - completed;
  document.getElementById('count-completed').textContent = completed;
  document.getElementById('count-overdue').textContent = overdue;
}

// ========== ACTIONS ==========
async function toggleTodo(id, e) {
  e.stopPropagation();
  try {
    await api('PATCH', `/todos/${id}/toggle`);
    await fetchTodos();
    fetchStats();
  } catch (_) {}
}

async function deleteTodo(id, e) {
  e.stopPropagation();
  if (!confirm('Delete this task?')) return;
  try {
    await api('DELETE', `/todos/${id}`);
    showToast('Task deleted', 'info');
    await fetchTodos();
    fetchStats();
  } catch (_) {}
}

async function clearCompleted() {
  if (!confirm('Delete all completed tasks?')) return;
  try {
    const r = await api('DELETE', '/todos/bulk/completed');
    showToast(r.message, 'success');
    await fetchTodos();
    fetchStats();
  } catch (_) {}
}

// ========== MODAL ==========
function openModal(todoData = null) {
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalTitle').textContent = todoData ? 'Edit Task' : 'New Task';
  document.getElementById('editId').value = todoData ? todoData._id : '';
  document.getElementById('inputTitle').value = todoData ? todoData.title : '';
  document.getElementById('inputDesc').value = todoData ? todoData.description : '';
  document.getElementById('inputPriority').value = todoData ? todoData.priority : 'medium';
  document.getElementById('inputCategory').value = todoData ? todoData.category : 'General';
  document.getElementById('inputDue').value = todoData && todoData.dueDate
    ? new Date(todoData.dueDate).toISOString().slice(0,16) : '';
  document.getElementById('inputTags').value = todoData ? (todoData.tags || []).join(', ') : '';

  overlay.classList.add('open');
  setTimeout(() => document.getElementById('inputTitle').focus(), 100);

  // Enter key to save
  document.getElementById('inputTitle').onkeydown = (e) => {
    if (e.key === 'Enter') saveTask();
  };
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.remove('open');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.getElementById('modalOverlay').classList.remove('open');
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openModal(); }
});

async function saveTask() {
  const id = document.getElementById('editId').value;
  const title = document.getElementById('inputTitle').value.trim();
  if (!title) { showToast('Title is required', 'error'); return; }

  const tagsRaw = document.getElementById('inputTags').value;
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  const payload = {
    title,
    description: document.getElementById('inputDesc').value.trim(),
    priority: document.getElementById('inputPriority').value,
    category: document.getElementById('inputCategory').value.trim() || 'General',
    dueDate: document.getElementById('inputDue').value || null,
    tags
  };

  try {
    if (id) {
      await api('PUT', `/todos/${id}`, payload);
      showToast('Task updated!', 'success');
    } else {
      await api('POST', '/todos', payload);
      showToast('Task created!', 'success');
    }
    document.getElementById('modalOverlay').classList.remove('open');
    await fetchTodos();
    fetchStats();
  } catch (_) {}
}

async function editTodo(id, e) {
  e.stopPropagation();
  try {
    const todo = await api('GET', `/todos/${id}`);
    openModal(todo);
  } catch (_) {}
}

// ========== FILTERS ==========
function setFilter(filter) {
  currentFilter = filter;
  currentPriority = null;

  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');

  const titles = { all: 'All Tasks', active: 'In Progress', completed: 'Completed', overdue: 'Overdue' };
  document.getElementById('pageTitle').textContent = titles[filter] || 'All Tasks';

  fetchTodos();
  if (window.innerWidth <= 700) toggleSidebar();
}

function setPriority(p) {
  currentPriority = currentPriority === p ? null : p;
  currentFilter = 'all';

  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  if (currentPriority) {
    document.querySelector(`[data-priority="${p}"]`)?.classList.add('active');
    document.getElementById('pageTitle').textContent = `${capitalize(p)} Priority`;
  } else {
    document.querySelector('[data-filter="all"]')?.classList.add('active');
    document.getElementById('pageTitle').textContent = 'All Tasks';
  }
  fetchTodos();
  if (window.innerWidth <= 700) toggleSidebar();
}

function handleSort(val) {
  currentSort = val;
  fetchTodos();
}

function handleSearch(val) {
  clearTimeout(searchTimer);
  searchQuery = val;
  searchTimer = setTimeout(fetchTodos, 350);
}

// ========== SIDEBAR TOGGLE ==========
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ========== THEME ==========
function loadTheme() {
  const saved = localStorage.getItem('tf-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('tf-theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeBtn');
  btn.innerHTML = theme === 'dark'
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
}

// ========== TOAST ==========
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = '0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

// ========== HELPERS ==========
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(date) {
  const now = new Date();
  const diff = date - now;
  if (diff < 0) return `Overdue ${Math.abs(Math.round(diff/86400000))}d ago`;
  if (diff < 86400000) return `Due today`;
  if (diff < 172800000) return `Due tomorrow`;
  return date.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}
