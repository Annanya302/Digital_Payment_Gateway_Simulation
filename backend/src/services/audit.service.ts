import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { AuditLog, AuditEventType, UserRole } from '../types/models.js';
import { logger } from '../utils/logger.js';
import { socketService } from './socket.service.js';

export interface CreateAuditLogParams {
  eventType: AuditEventType;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetResource: string;
  action: string;
  details?: Record<string, any>;
}

export class AuditService {
  public log(params: CreateAuditLogParams): AuditLog {
    const log: AuditLog = {
      log_id: uuidv4(),
      event_type: params.eventType,
      actor_id: params.actorId,
      actor_name: params.actorName,
      actor_role: params.actorRole,
      target_resource: params.targetResource,
      action: params.action,
      details: params.details || {},
      created_at: new Date().toISOString(),
    };

    db.createAuditLog(log);
    logger.info(`[Audit] ${log.event_type} | ${log.actor_name} (${log.actor_role}) -> ${log.action}`);

    // Notify admin channel in real time
    socketService.emitToAdmin('audit_log_created', log);

    return log;
  }

  public getAuditLogs(filter?: {
    eventType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let logs = db.getAllAuditLogs();

    if (filter?.eventType && filter.eventType !== 'ALL') {
      logs = logs.filter((l) => l.event_type === filter.eventType);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.actor_name.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.target_resource.toLowerCase().includes(q) ||
          l.log_id.toLowerCase().includes(q)
      );
    }

    const total = logs.length;
    const page = Math.max(1, filter?.page || 1);
    const limit = Math.max(1, filter?.limit || 20);
    const startIndex = (page - 1) * limit;

    return {
      logs: logs.slice(startIndex, startIndex + limit),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const auditService = new AuditService();
