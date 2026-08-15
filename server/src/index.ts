import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import gigRoutes from './routes/gigRoutes';
import eventRoutes from './routes/eventRoutes';
import applicationRoutes from './routes/applicationRoutes';
import bookingRoutes from './routes/bookingRoutes';
import reviewRoutes from './routes/reviewRoutes';
import chatRoutes from './routes/chatRoutes';
import webhookRoutes from './routes/webhookRoutes';
import discoveryRoutes from './routes/discoveryRoutes';
import engagementRoutes from './routes/engagementRoutes';
import connectionRoutes from './routes/connectionRoutes';
import meetupRoutes from './routes/meetupRoutes';
import tableRoutes from './routes/tableRoutes';
import reservationRoutes from './routes/reservationRoutes';
import adminRoutes from './routes/adminRoutes';
import adRoutes from './routes/adRoutes';
import { errorHandler } from './middleware/errorHandler';
import http from 'http';
import { initSocket } from './sockets/index';

dotenv.config();

const app: Express = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Init Socket.io
initSocket(server);

// Middleware
// Note: Webhooks need raw body, so we mount them before express.json()
app.use('/api/webhooks', webhookRoutes);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'StageLink API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/meetups', meetupRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ads', adRoutes);

// Error Handling Middleware
app.use(errorHandler);

server.listen(PORT as number, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} (0.0.0.0)`);
});
