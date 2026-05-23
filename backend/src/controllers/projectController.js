const { Project, Task } = require('../models');

// Get all projects with optional filtering and pagination
exports.getAllProjects = async (req, res) => {
  try {
    const { status, clientName, page = 1, limit = 10 } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (clientName) where.clientName = { [require('sequelize').Op.like]: `%${clientName}%` };

    const projects = await Project.findAndCountAll({
      where,
      include: [{ model: Task, as: 'tasks' }],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      projects: projects.rows,
      total: projects.count,
      page: parseInt(page),
      totalPages: Math.ceil(projects.count / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [{ model: Task, as: 'tasks' }]
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a project
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await project.update(req.body);
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await project.destroy();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get project statistics
exports.getProjectStats = async (req, res) => {
  try {
    const stats = await Project.findAll({
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalProjects'],
        [require('sequelize').fn('SUM', require('sequelize').literal('CASE WHEN status = "active" THEN 1 ELSE 0 END')), 'activeProjects'],
        [require('sequelize').fn('SUM', require('sequelize').literal('CASE WHEN status = "completed" THEN 1 ELSE 0 END')), 'completedProjects'],
        [require('sequelize').fn('AVG', require('sequelize').col('budget')), 'averageBudget']
      ]
    });
    
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};