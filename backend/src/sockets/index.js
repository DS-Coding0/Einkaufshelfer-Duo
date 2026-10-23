const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // JWT-Auth beim Handshake
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Kein Token'));
      socket.data.user = jwt.verify(token, config.jwtSecret);
      next();
    } catch {
      next(new Error('Ungültiges Token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join:list', (listId) => {
      socket.join(listId);
    });
    socket.on('leave:list', (listId) => {
      socket.leave(listId);
    });
  });

  return io;
}

function getIo() {
  if (!io) throw new Error('Socket.IO nicht initialisiert');
  return io;
}

module.exports = { initSocket, getIo };