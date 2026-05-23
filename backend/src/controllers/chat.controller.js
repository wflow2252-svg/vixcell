const ChatSession = require('../models/ChatSession');
const Message = require('../models/Message');
const { getIo } = require('../socket');

exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await ChatSession.find().sort('-updatedAt');
    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ session: req.params.id }).sort('createdAt');
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

exports.closeSession = async (req, res, next) => {
  try {
    const session = await ChatSession.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true, runValidators: true }
    );
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const io = getIo();
    io.to(session._id.toString()).emit('session:closed', { sessionId: session._id });
    io.to('admin_room').emit('session:closed', { sessionId: session._id });

    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};
