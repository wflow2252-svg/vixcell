const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, statsController.getDashboardStats);

module.exports = router;
