const express = require('express');
const router = express.Router();
const vixAiController = require('../controllers/vixAi.controller');

router.post('/chat', vixAiController.chat);
router.post('/reset', vixAiController.reset);

module.exports = router;
