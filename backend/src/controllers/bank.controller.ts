import { Response, NextFunction } from 'express';
import { bankService } from '../services/bank.service.js';
import { BankCode, BankHealthStatus } from '../types/models.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class BankController {
  public async getBanks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const banks = bankService.getAllBanks();
      res.status(200).json({ success: true, data: banks });
    } catch (err) {
      next(err);
    }
  }

  public async getUserAccounts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const accounts = bankService.getUserBankAccounts(userId);
      res.status(200).json({ success: true, data: accounts });
    } catch (err) {
      next(err);
    }
  }

  public async linkAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { bankCode, accountType } = req.body;

      if (!bankCode) {
        return res.status(400).json({ success: false, message: 'Bank code is required' });
      }

      const account = await bankService.linkBankAccount({
        userId,
        bankCode: bankCode as BankCode,
        accountType: accountType || 'SAVINGS',
      });

      res.status(201).json({
        success: true,
        message: 'Bank account linked and verified successfully',
        data: account,
      });
    } catch (err) {
      next(err);
    }
  }

  public async setPrimary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const accountId = req.params.id;
      const account = await bankService.setPrimaryAccount(userId, accountId);
      res.status(200).json({ success: true, data: account });
    } catch (err) {
      next(err);
    }
  }

  public async topUpAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const accountId = req.params.id;
      const { amount } = req.body;

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
      }

      const result = await bankService.topUpBankAccount({
        userId,
        accountId,
        amount: numAmount,
      });

      res.status(200).json({
        success: true,
        message: `₹${numAmount.toFixed(2)} credited to bank account successfully`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateHealth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const bankCode = req.params.code;
      const { status } = req.body;

      if (!['ONLINE', 'DEGRADED', 'DOWN'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be ONLINE, DEGRADED, or DOWN',
        });
      }

      const adminUser = { id: req.user!.userId, name: req.user!.name };
      const bank = bankService.updateBankHealth(bankCode, status as BankHealthStatus, adminUser);

      res.status(200).json({
        success: true,
        message: `Bank ${bank.name} status updated to ${status}`,
        data: bank,
      });
    } catch (err) {
      next(err);
    }
  }

  public async checkBalance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const accountId = req.params.id;
      const { pin } = req.body;

      if (!pin) {
        return res.status(400).json({ success: false, message: 'PIN is required' });
      }

      const result = await bankService.checkBalance({
        userId,
        accountId,
        pin,
      });

      res.status(200).json({
        success: true,
        message: 'PIN verified successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const bankController = new BankController();
