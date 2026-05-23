const ChatSession = require('../models/ChatSession');
const Message = require('../models/Message');
const fcmService = require('../services/fcm.service');

module.exports = (io, socket) => {
  // Visitor joins chat
  socket.on('visitor:join', async (data) => {
    try {
      const { visitorId, visitorName } = data;
      let session = await ChatSession.findOne({ visitorId, status: 'open' });
      
      if (!session) {
        session = await ChatSession.create({
          visitorId,
          visitorName: visitorName || 'Anonymous Visitor',
          status: 'open'
        });
        io.to('admin_room').emit('session:new', session);
      }
      
      socket.join(session._id.toString());
      socket.emit('session:joined', session);
    } catch (error) {
      console.error('Error in visitor:join', error);
    }
  });

  // Visitor sends message
  socket.on('visitor:message', async (data) => {
    try {
      const { sessionId, content } = data;
      const message = await Message.create({
        session: sessionId,
        sender: 'visitor',
        content
      });
      
      await ChatSession.findByIdAndUpdate(sessionId, {
        lastMessage: content,
        $inc: { unreadCount: 1 },
        updatedAt: Date.now()
      });
      
      io.to(sessionId).emit('visitor:message', message);
      io.to('admin_room').emit('visitor:message', { ...message.toObject(), sessionId });
      
      // Notify admins
      fcmService.notifyAdmins('New Chat Message', content, { type: 'chat', sessionId });
    } catch (error) {
      console.error('Error in visitor:message', error);
    }
  });

  socket.on('visitor:typing', (data) => {
    io.to('admin_room').emit('visitor:typing', data);
  });
};
