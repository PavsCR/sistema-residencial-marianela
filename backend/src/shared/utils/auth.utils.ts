import { hash, compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export function generateToken(userId: number, email: string, role: string): string {
  return sign({ userId, email, role }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): any {
  return verify(token, JWT_SECRET);
}
