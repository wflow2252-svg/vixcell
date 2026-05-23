const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', projectsController.createProjectRequest);
router.get('/', protect, projectsController.getProjectRequests);
router.put('/:id/status', protect, projectsController.updateProjectStatus);

module.exports = router;
