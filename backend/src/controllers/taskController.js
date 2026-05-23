const { Task, Project } = require('../models');

// Get all tasks with optional filtering and pagination
exports.getAllTasks = async (req, res) => {
  try {
    const { status, priority, projectId, page = 1, limit = 10 } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;

    const tasks = await Task.findAndCountAll({
      where,
      include: [{ model: Project, as: 'project' }],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      tasks: tasks.rows,
      total: tasks.count,
      page: parseInt(page),
      totalPages: Math.ceil(tasks.count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: Project, as: 'project' }]
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await task.update(req.body);
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get task statistics
exports.getTaskStats = async (req, res) => {
  try {
    const stats = await Task.findAll({
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalTasks'],
        [require('sequelize').fn('SUM', require('sequelize').literal('CASE WHEN status = "todo" THEN 1 ELSE 0 END')), 'todoTasks'],
        [require('sequelize').fn('SUM', require('sequelize').literal('CASE WHEN status = "in progress" THEN 1 ELSE 0 END')), 'inProgressTasks'],
        [require('sequelize').fn('SUM', require('sequelize').literal('CASE WHEN status = "review" THEN 1 ELSE 0 END')), 'reviewTasks'],
        [require('sequelize').fn('SUM', require('sequelize').literal('CASE WHEN status = "done" THEN 1 ELSE 0 END')), 'doneTasks']
      ]
    });
    
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};