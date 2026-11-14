import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { Notification, NotificationType } from '../types/models.js';

export class NotificationService {
  public async sendNotification(params: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, any>;
  }): Promise<Notification> {
    const notif: Notification = {
      notification_id: uuidv4(),
      user_id: params.userId,
      title: params.title,
      message: params.message,
      channel: 'IN_APP',
      type: params.type,
      read_status: false,
      metadata: params.metadata,
      sent_at: new Date().toISOString(),
    };

    return db.createNotification(notif);
  }

  public async getUserNotifications(userId: string): Promise<Notification[]> {
    return db.getNotificationsByUserId(userId);
  }

  public async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    return db.markNotificationAsRead(notificationId, userId);
  }

  public async markAllAsRead(userId: string): Promise<number> {
    return db.markAllNotificationsAsRead(userId);
  }
}

export const notificationService = new NotificationService();
