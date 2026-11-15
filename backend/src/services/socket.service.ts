import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger.js';

class SocketService {
  private io: SocketIOServer | null = null;

  public init(httpServer: HttpServer, corsOrigin: string) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info(`[SocketService] Client connected: ${socket.id}`);

      // Allow client to subscribe to their specific user channel
      socket.on('join_user', (userId: string) => {
        if (userId) {
          socket.join(`user:${userId}`);
          logger.info(`[SocketService] Socket ${socket.id} joined channel user:${userId}`);
        }
      });

      // Allow admin users to subscribe to global admin telemetry
      socket.on('join_admin', () => {
        socket.join('admin_channel');
        logger.info(`[SocketService] Socket ${socket.id} joined admin_channel`);
      });

      socket.on('disconnect', () => {
        logger.info(`[SocketService] Client disconnected: ${socket.id}`);
      });
    });

    logger.info('[SocketService] Real-time WebSocket server initialized');
  }

  public emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  public emitToAdmin(event: string, data: any) {
    if (this.io) {
      this.io.to('admin_channel').emit(event, data);
    }
  }

  public broadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}

export const socketService = new SocketService();
