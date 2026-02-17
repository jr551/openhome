/**
 * local server entry file, for local development
 */
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import jwt from 'jsonwebtoken';

// Issue #2: Security: JWT/refresh secrets have insecure defaults
const JWT_SECRET = process.env.JWT_SECRET || 'insecure-dev-secret';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"]
  }
});

// Attach io to app so routes can use it
app.set('io', io);

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        socket.data.user = payload;
        next();
    } catch (_err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.data.user?.userId);

  // Join family room
  if (socket.data.user?.familyId) {
      socket.join(socket.data.user.familyId);
      console.log(`User ${socket.data.user.userId} joined family ${socket.data.user.familyId}`);
  }

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const server = httpServer.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
