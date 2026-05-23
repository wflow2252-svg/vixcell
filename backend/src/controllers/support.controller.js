const SupportTicket = require('../models/SupportTicket');
const fcmService = require('../services/fcm.service');
const { getIo } = require('../socket');

exports.createTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.create(req.body);

    const io = getIo();
    io.to('admin_room').emit('ticket:new', ticket);
    fcmService.notifyAdmins('New Support Ticket', `Title: ${ticket.title} (${ticket.priority} priority).`, { type: 'ticket', ticketId: ticket._id.toString() });

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Support ticket submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find().sort('-createdAt');
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
};

exports.updateTicketStatus = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};
