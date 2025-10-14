import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/autenticacion-seguridad/auth.routes';
import solicitudesRoutes from './routes/solicitudes/solicitudes.routes';
import casasRoutes from './routes/casas';
import cambiosRoutes from './routes/cambios';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Running' });
});

// Routes
app.use('/api/usuarios', authRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/casas', casasRoutes);
app.use('/api/cambios', cambiosRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

export default app;
