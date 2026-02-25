import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { handleInterviewSocket } from './interviewSocket.js';

/**
 * Initialize Socket.io on your existing HTTP server.
 *
 * In your server.js you'll call:
 *   import { initializeSocket } from './socket/socketServer.js';
 *   const server = http.createServer(app);
 *   initializeSocket(server);
 *   server.listen(PORT);
 */
export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    maxHttpBufferSize: 1e7   // 10MB for audio chunks
  });

  // /interview namespace — separate from main socket
  const interviewNs = io.of('/interview');

  // Authenticate socket connections with your existing JWT
  interviewNs.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  interviewNs.on('connection', (socket) => {
    console.log(`[Socket] Interview connection: ${socket.id} (user: ${socket.userId})`);
    handleInterviewSocket(socket, interviewNs);
  });

  return io;
}