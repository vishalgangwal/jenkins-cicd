# TaskFlow — DevOps Todo App 🚀

A full-stack **Todo application** built for demonstrating a complete **DevOps CI/CD pipeline** with Jenkins, Docker, and MongoDB.

![Node.js](https://img.shields.io/badge/Node.js-18-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green)
![Jenkins](https://img.shields.io/badge/Jenkins-CI%2FCD-red)

---

## ✨ Features

- **Beautiful UI** — Dark/light theme, responsive design
- **Full CRUD** — Create, read, update, delete tasks
- **Priorities** — High / Medium / Low with color indicators
- **Categories & Tags** — Organize tasks your way
- **Due Dates** — Overdue detection and alerts
- **Dashboard Stats** — Completion rate, task counts
- **Search & Filter** — Instant search, filter by status/priority
- **REST API** — Full JSON API with Joi validation
- **Health Check** endpoint for Docker/Kubernetes

---

## 🏗 Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Backend     | Node.js 18 + Express.js       |
| Database    | MongoDB 6 + Mongoose          |
| Frontend    | Vanilla JS + CSS (no framework)|
| Validation  | Joi                           |
| Testing     | Jest + Supertest              |
| Container   | Docker (multi-stage build)    |
| Orchestration| Docker Compose               |
| CI/CD       | Jenkins Declarative Pipeline  |

---

## 🚀 Quick Start

### Option 1 — Docker Compose (Recommended)
```bash
git clone https://github.com/vishalgangwal/devops-todo-app
cd devops-todo-app

# Production
docker compose up -d

# Development (with hot reload)
docker compose -f docker-compose.dev.yml up
```

App: http://localhost:3000  
Mongo Express UI: http://localhost:8081

### Option 2 — Local Development
```bash
# Install dependencies
npm install

# Start MongoDB locally first, then:
npm run dev
```

---

## 🔌 API Reference

| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | /api/todos                | List all todos (filterable)|
| POST   | /api/todos                | Create a todo            |
| GET    | /api/todos/:id            | Get single todo          |
| PUT    | /api/todos/:id            | Update a todo            |
| PATCH  | /api/todos/:id/toggle     | Toggle complete          |
| DELETE | /api/todos/:id            | Delete a todo            |
| DELETE | /api/todos/bulk/completed | Delete all completed     |
| GET    | /api/stats                | Dashboard statistics     |
| GET    | /health                   | Health check             |

### Query Parameters (GET /api/todos)
| Param     | Values              | Example              |
|-----------|---------------------|----------------------|
| completed | true / false        | ?completed=false     |
| priority  | low / medium / high | ?priority=high       |
| search    | string              | ?search=docker       |
| sort      | field name          | ?sort=-createdAt     |
| page      | number              | ?page=1              |
| limit     | number              | ?limit=20            |

---

## 🐳 Docker

### Build manually
```bash
docker build -t taskflow:latest .
docker run -p 3000:3000 -e MONGO_URI=mongodb://host:27017/tododb taskflow:latest
```

### Multi-stage build
- **Stage 1** (deps): Production npm install
- **Stage 2** (builder): Full install + run tests
- **Stage 3** (production): Minimal image with non-root user

---

## ⚙️ Jenkins Pipeline Stages

```
Checkout → Install → Lint → Test → Security Audit →
Build Image → Test Image → Push to DockerHub → Deploy → Smoke Test
```

### Setup Jenkins
1. Install plugins: **Pipeline**, **Docker Pipeline**, **Git**
2. Add credentials:
   - ID: `dockerhub-credentials` (Docker Hub username/password)
3. Create a **Pipeline** job pointing to this repo
4. The `Jenkinsfile` handles the rest!

---

## 🧪 Tests

```bash
npm test              # Run all tests
npm test -- --coverage # With coverage report
```

---

## 📁 Project Structure

```
devops-todo-app/
├── src/
│   ├── server.js          # Express app entry point
│   ├── models/
│   │   └── Todo.js        # Mongoose schema
│   └── routes/
│       ├── todos.js       # CRUD API routes
│       └── stats.js       # Dashboard stats
├── public/
│   ├── index.html         # SPA frontend
│   ├── css/style.css      # Stylesheet
│   └── js/app.js          # Frontend logic
├── test/
│   └── app.test.js        # Jest tests
├── Dockerfile             # Multi-stage Docker build
├── docker-compose.yml     # Production compose
├── docker-compose.dev.yml # Development compose
├── Jenkinsfile            # CI/CD pipeline
└── .env.example           # Environment template
```

---

## 👨‍💻 Author

**Vishal Gangwal**  
DevOps Engineer | AWS | Kubernetes | Docker | Terraform | Jenkins  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue)](https://linkedin.com/in/vishalgangwal)

---

## 📄 License

MIT
