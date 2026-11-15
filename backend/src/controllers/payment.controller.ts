import { Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class PaymentController {
  public async sendMoney(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;
      const receipt = await paymentService.sendMoney({
        senderId: req.user!.userId,
        receiverIdentifier: req.body.receiverIdentifier,
        amount: Number(req.body.amount),
        paymentMode: req.body.paymentMode,
        pin: req.body.pin,
        senderBankCode: req.body.senderBankCode,
        idempotencyKey,
        simulatedOutcome: req.body.simulatedOutcome,
        cardDetails: req.body.cardDetails,
      });

      const statusCode = receipt.status === 'SUCCESS' ? 200 : 400;
      res.status(statusCode).json({
        success: receipt.status === 'SUCCESS',
        message:
          receipt.status === 'SUCCESS'
            ? 'Payment processed successfully'
            : `Payment failed: ${receipt.failureReason}`,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }

  public async payMerchant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;
      const receipt = await paymentService.payMerchant({
        senderId: req.user!.userId,
        merchantId: req.body.merchantId,
        amount: Number(req.body.amount),
        paymentMode: req.body.paymentMode,
        pin: req.body.pin,
        senderBankCode: req.body.senderBankCode,
        idempotencyKey,
        simulatedOutcome: req.body.simulatedOutcome,
        cardDetails: req.body.cardDetails,
      });

      const statusCode = receipt.status === 'SUCCESS' ? 200 : 400;
      res.status(statusCode).json({
        success: receipt.status === 'SUCCESS',
        message:
          receipt.status === 'SUCCESS'
            ? 'Merchant payment processed successfully'
            : `Merchant payment failed: ${receipt.failureReason}`,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }

  public async reversePayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = req.params.id as string;
      const isAdmin = req.user!.role === 'admin';
      const receipt = await paymentService.reverseTransaction({
        paymentId,
        reason: req.body.reason,
        requestingUserId: req.user!.userId,
        isAdmin,
      });

      res.status(200).json({
        success: true,
        message: 'Transaction reversal completed successfully',
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }

  public async reconcilePayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = req.params.id as string;
      const receipt = await paymentService.reconcilePayment(paymentId);

      res.status(200).json({
        success: true,
        message: 'Transaction reconciled safely',
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getPaymentDetails(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const paymentId = req.params.id as string;
      const isAdmin = req.user!.role === 'admin';
      const receipt = await paymentService.getPaymentDetails(paymentId, req.user!.userId, isAdmin);

      res.status(200).json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getMerchants(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchants = await paymentService.getAllMerchants();
      res.status(200).json({
        success: true,
        data: merchants,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
