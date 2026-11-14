import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { config } from '../config/env.js';
import { User, Wallet, SafeUser } from '../types/models.js';
import { hashPassword, comparePassword, hashPin, comparePin } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { notificationService } from './notification.service.js';

export class AuthService {
  public async register(data: {
    name: string;
    email: string;
    mobile: string;
    password: string;
    pin: string;
  }): Promise<{ user: SafeUser; token: string; wallet: Wallet }> {
    // 1. Check duplicate email
    const existingEmail = db.findUserByEmail(data.email);
    if (existingEmail) {
      throw { statusCode: 409, message: 'Email is already registered' };
    }

    // 2. Check duplicate mobile
    const existingMobile = db.findUserByMobile(data.mobile);
    if (existingMobile) {
      throw { statusCode: 409, message: 'Mobile number is already registered' };
    }

    // 3. Hash password and PIN
    const password_hash = await hashPassword(data.password);
    const pin_hash = await hashPin(data.pin);

    // 4. Create user
    const userId = uuidv4();
    const newUser: User = {
      user_id: userId,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      mobile: data.mobile.trim(),
      password_hash,
      pin_hash,
      role: 'customer',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.createUser(newUser);

    // 5. Create default wallet
    const wallet: Wallet = {
      wallet_id: uuidv4(),
      user_id: userId,
      balance: config.defaultWalletBalance,
      currency: 'INR',
      daily_limit: config.maxDailyTransactionLimit,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.createWallet(wallet);

    // 6. Generate welcome notification
    await notificationService.sendNotification({
      userId,
      title: 'Welcome to Payment Gateway Simulation',
      message: `Account created successfully! Your simulated wallet is credited with ₹${config.defaultWalletBalance.toLocaleString('en-IN')}.`,
      type: 'SYSTEM',
    });

    // 7. Generate JWT token
    const token = generateToken({
      userId: newUser.user_id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    const { password_hash: _, pin_hash: __, ...safeUser } = newUser;
    return { user: safeUser, token, wallet };
  }

  public async login(data: {
    email: string;
    password: string;
  }): Promise<{ user: SafeUser; token: string; wallet?: Wallet }> {
    const user = db.findUserByEmail(data.email);
    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    if (user.status !== 'active') {
      throw { statusCode: 403, message: `Account is ${user.status}. Please contact administrator.` };
    }

    const isPasswordValid = await comparePassword(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const token = generateToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const wallet = db.getWalletByUserId(user.user_id);
    const { password_hash: _, pin_hash: __, ...safeUser } = user;

    return { user: safeUser, token, wallet };
  }

  public async getProfile(userId: string): Promise<{ user: SafeUser; wallet?: Wallet }> {
    const user = db.findUserById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const wallet = db.getWalletByUserId(userId);
    const { password_hash: _, pin_hash: __, ...safeUser } = user;

    return { user: safeUser, wallet };
  }

  public async changePin(userId: string, currentPin: string, newPin: string): Promise<boolean> {
    const user = db.findUserById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const isPinValid = await comparePin(currentPin, user.pin_hash);
    if (!isPinValid) {
      throw { statusCode: 400, message: 'Current PIN is incorrect' };
    }

    user.pin_hash = await hashPin(newPin);
    user.updated_at = new Date().toISOString();

    await notificationService.sendNotification({
      userId,
      title: 'Security Alert: PIN Changed',
      message: 'Your simulated transaction PIN was updated successfully.',
      type: 'SYSTEM',
    });

    return true;
  }
}

export const authService = new AuthService();
