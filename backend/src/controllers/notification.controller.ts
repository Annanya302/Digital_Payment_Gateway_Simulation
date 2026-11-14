import { Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class NotificationController {
  public async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await notificationService.getUserNotifications(req.user!.userId);
      const unreadCount = notifications.filter((n) => !n.read_status).length;

      res.status(200).json({
        success: true,
        data: {
          notifications,
          unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const notificationId = req.params.id as string;
      const updated = await notificationService.markAsRead(notificationId, req.user!.userId);

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Notification not found or access denied',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  public async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await notificationService.markAllAsRead(req.user!.userId);
      res.status(200).json({
        success: true,
        message: `${count} notifications marked as read`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
