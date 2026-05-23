const express = require('express');
const router = express.Router();
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats
} = require('../controllers/projectController');

// Get all projects
router.get('/', getAllProjects);

// Get project statistics
router.get('/stats', getProjectStats);

// Get a single project
router.get('/:id', getProjectById);

// Create a new project
router.post('/', createProject);

// Update a project
router.put('/:id', updateProject);

// Delete a project
router.delete('/:id', deleteProject);

module.exports = router;