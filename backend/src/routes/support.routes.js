const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', supportController.createTicket);
router.get('/', protect, supportController.getTickets);
router.put('/:id/status', protect, supportController.updateTicketStatus);

module.exports = router;
