import bcrypt from 'bcryptjs';

export function hashPassword(password: string): string {
  // Use bcryptjs to hash passwords securely with 10 salt rounds
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  // Compare plain text password against the stored bcrypt hash
  return bcrypt.compareSync(password, hash);
}
