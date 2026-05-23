const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/sessions', protect, chatController.getSessions);
router.get('/sessions/:id/messages', protect, chatController.getMessages);
router.put('/sessions/:id/close', protect, chatController.closeSession);

module.exports = router;
