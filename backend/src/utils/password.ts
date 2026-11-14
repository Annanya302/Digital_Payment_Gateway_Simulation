import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export async function hashPin(plainPin: string): Promise<string> {
  return bcrypt.hash(plainPin, SALT_ROUNDS);
}

export async function comparePin(plainPin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPin, hash);
}
