import { Response, NextFunction } from 'express';
import { walletService } from '../services/wallet.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class WalletController {
  public async getWallet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const wallet = await walletService.getWallet(req.user!.userId);
      res.status(200).json({
        success: true,
        data: wallet,
      });
    } catch (error) {
      next(error);
    }
  }

  public async topUpWallet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount } = req.body;
      const result = await walletService.topUpWallet(req.user!.userId, Number(amount));
      res.status(200).json({
        success: true,
        message: `Wallet credited with ₹${Number(amount).toFixed(2)}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getWalletTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const transactions = await walletService.getWalletTransactions(req.user!.userId);
      res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const walletController = new WalletController();
