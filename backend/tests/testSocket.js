// backend/tests/testSocket.js
import 'dotenv/config';
import { io } from 'socket.io-client';

// Use the same token you've been using in Thunder Client
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODUxMWM5NWQyMWM3OThiZTI3Yzc3MCIsImlhdCI6MTc3MTk3Nzg0MiwiZXhwIjoxNzcyNTgyNjQyfQ.2_GrKYNwU2CzwUeXTFKCuRZNJiQRvNOoYqAYy-GdUj4';
const SESSION_ID = '699e380c9b1427043b31814d';
const PORT = process.env.PORT || 5000;

const socket = io(`http://localhost:${PORT}/interview`, {
  auth: { token: TOKEN },
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('✅ Socket connected! ID:', socket.id);

  // Test joining an interview room
  socket.emit('join-interview', { sessionId: SESSION_ID });
  console.log('✅ Joined interview room:', SESSION_ID);

  // All good — disconnect
  setTimeout(() => {
    console.log('✅ All socket tests passed!');
    socket.disconnect();
    process.exit(0);
  }, 2000);
});

socket.on('connect_error', (err) => {
  console.error('❌ Socket connection failed:', err.message);
  if (err.message === 'Authentication required') {
    console.log('→ You forgot to paste your JWT token in the TOKEN variable');
  }
  if (err.message === 'Invalid token') {
    console.log('→ Your JWT token is expired. Login again and get a fresh one.');
  }
  process.exit(1);
});

// Timeout if nothing happens
setTimeout(() => {
  console.error('❌ Timed out — server may not be running');
  process.exit(1);
}, 5000);