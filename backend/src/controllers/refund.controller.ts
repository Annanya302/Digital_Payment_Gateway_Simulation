import { Response, NextFunction } from 'express';
import { refundService } from '../services/refund.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class RefundController {
  public async requestRefund(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paymentId, reason, amount } = req.body;
      const result = await refundService.requestRefund({
        paymentId,
        userId: req.user!.userId,
        reason,
        amount: amount !== undefined ? Number(amount) : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Refund request processed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getRefunds(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refunds = await refundService.getRefunds(req.user!.userId);
      res.status(200).json({
        success: true,
        data: refunds,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getRefundById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refundId = req.params.id as string;
      const isAdmin = req.user!.role === 'admin';
      const result = await refundService.getRefundById(refundId, req.user!.userId, isAdmin);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const refundController = new RefundController();
