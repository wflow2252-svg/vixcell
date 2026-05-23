const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const chatSocket = require('./chat.socket');
const adminSocket = require('./admin.socket');

let io;

const init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: '*', // Adjust this for production
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware for admin sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vixcell_secret_key');
        socket.user = decoded;
        socket.isAdmin = true;
      } catch (error) {
        socket.isAdmin = false;
      }
    } else {
      socket.isAdmin = false;
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`New socket connected: ${socket.id} (Admin: ${socket.isAdmin})`);

    chatSocket(io, socket);
    if (socket.isAdmin) {
      adminSocket(io, socket);
    }

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { init, getIo };
