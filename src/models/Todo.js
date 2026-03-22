const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    completed: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
      maxlength: [50, 'Category cannot exceed 50 characters']
    },
    dueDate: {
      type: Date,
      default: null
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 30
    }],
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual: is overdue
todoSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.completed) return false;
  return new Date() > new Date(this.dueDate);
});

// Pre-save: set completedAt when marking done
todoSchema.pre('save', function (next) {
  if (this.isModified('completed')) {
    this.completedAt = this.completed ? new Date() : null;
  }
  next();
});

// Indexes for performance
todoSchema.index({ completed: 1 });
todoSchema.index({ priority: 1 });
todoSchema.index({ category: 1 });
todoSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Todo', todoSchema);
