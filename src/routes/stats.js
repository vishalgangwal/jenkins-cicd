const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// GET dashboard stats
router.get('/', async (req, res) => {
  try {
    const [total, completed, high, medium, low, overdue] = await Promise.all([
      Todo.countDocuments(),
      Todo.countDocuments({ completed: true }),
      Todo.countDocuments({ priority: 'high', completed: false }),
      Todo.countDocuments({ priority: 'medium', completed: false }),
      Todo.countDocuments({ priority: 'low', completed: false }),
      Todo.countDocuments({ dueDate: { $lt: new Date() }, completed: false })
    ]);

    // Category breakdown
    const categoryStats = await Todo.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, done: { $sum: { $cond: ['$completed', 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    // Completion trend last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const trend = await Todo.aggregate([
      { $match: { completedAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      total,
      completed,
      pending: total - completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      priority: { high, medium, low },
      overdue,
      categories: categoryStats,
      trend
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
