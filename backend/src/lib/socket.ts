import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '@logger/logger';

let io: SocketIOServer | null = null;

export function initSocket(server: HttpServer): void {
  io = new SocketIOServer(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/socket.io',
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`[Socket] connected: ${socket.id}`);

    socket.on('join_job', (jobId: string) => {
      void socket.join(`job:${jobId}`);
    });

    socket.on('leave_job', (jobId: string) => {
      void socket.leave(`job:${jobId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket] disconnected: ${socket.id}`);
    });
  });
}

export function emitToJob(jobId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`job:${jobId}`).emit(event, data);
}
