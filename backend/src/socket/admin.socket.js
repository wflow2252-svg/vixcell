const ChatSession = require('../models/ChatSession');
const Message = require('../models/Message');

module.exports = (io, socket) => {
  socket.on('admin:join', () => {
    socket.join('admin_room');
    console.log(`Admin joined admin_room: ${socket.id}`);
  });

  socket.on('admin:join_session', (data) => {
    const { sessionId } = data;
    socket.join(sessionId);
    ChatSession.findByIdAndUpdate(sessionId, { unreadCount: 0 }).exec();
  });

  socket.on('admin:leave_session', (data) => {
    const { sessionId } = data;
    socket.leave(sessionId);
  });

  socket.on('admin:message', async (data) => {
    try {
      const { sessionId, message: content } = data;
      const message = await Message.create({
        session: sessionId,
        sender: 'admin',
        content
      });
      
      await ChatSession.findByIdAndUpdate(sessionId, {
        lastMessage: content,
        updatedAt: Date.now()
      });
      
      io.to(sessionId).emit('admin:message', message);
    } catch (error) {
      console.error('Error in admin:message', error);
    }
  });

  socket.on('admin:typing', (data) => {
    const { sessionId, isTyping } = data;
    io.to(sessionId).emit('admin:typing', { isTyping });
  });
};
