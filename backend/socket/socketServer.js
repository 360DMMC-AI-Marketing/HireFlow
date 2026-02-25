import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { handleInterviewSocket } from './interviewSocket.js';

export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    maxHttpBufferSize: 1e7
  });

  const interviewNs = io.of('/interview');

  interviewNs.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;

      // If this is a candidate joining via magic link,
      // store their allowed sessionId so they can only access their own interview
      if (decoded.isInterviewToken) {
        socket.isCandidate = true;
        socket.allowedSessionId = decoded.sessionId.toString();
      }

      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  interviewNs.on('connection', (socket) => {
    console.log(
      `[Socket] Interview connection: ${socket.id} (user: ${socket.userId}, ` +
      `role: ${socket.userRole}, candidate: ${socket.isCandidate || false})`
    );
    handleInterviewSocket(socket, interviewNs);
  });

  return io;
}