const ChatSession = require('../models/ChatSession');
const ProjectRequest = require('../models/ProjectRequest');
const SupportTicket = require('../models/SupportTicket');
const DemoRequest = require('../models/DemoRequest');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      activeChats,
      pendingProjects,
      openTickets,
      generatedDemos
    ] = await Promise.all([
      ChatSession.countDocuments({ status: 'open' }),
      ProjectRequest.countDocuments({ status: 'new' }),
      SupportTicket.countDocuments({ status: 'open' }),
      DemoRequest.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        activeChats,
        pendingProjects,
        openTickets,
        generatedDemos
      }
    });
  } catch (error) {
    next(error);
  }
};
