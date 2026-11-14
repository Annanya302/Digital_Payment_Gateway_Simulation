import { Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class TransactionController {
  public async getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, type, search, startDate, endDate, page, limit } = req.query;
      const result = await transactionService.getTransactions({
        userId: req.user!.userId,
        status: status as string,
        type: type as string,
        search: search as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getTransactionById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const transactionId = req.params.id as string;
      const isAdmin = req.user!.role === 'admin';
      const result = await transactionService.getTransactionById(transactionId, req.user!.userId, isAdmin);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();
