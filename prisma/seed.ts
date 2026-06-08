import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

async function main() {
  console.log('🌱 Starting database seeding with bcrypt and transaction categories...');

  // Clean existing data
  await prisma.notification.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.virtualCard.deleteMany({});
  await prisma.savingsPot.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database tables.');

  // Create legacy user: mo
  const userMo = await prisma.user.create({
    data: {
      name: 'Mo',
      email: 'mo@gmail.com',
      passwordHash: hashPassword('password123'),
      pin: 1234,
      accountNo: 'u1Uo11$',
      balance: 1500.00,
      age: 20,
      avatarUrl: '/avatars/avatar-1.svg',
      themePreference: 'DARK',
      notificationPreference: 'ALL',
      cards: {
        create: [
          {
            cardNumber: '5412750012345678',
            expiry: '12/29',
            cvv: '999',
            status: 'ACTIVE',
          }
        ]
      },
      savingsPots: {
        create: [
          {
            name: 'Dream Car',
            targetAmount: 15000,
            currentBalance: 200,
          },
          {
            name: 'Emergency Fund',
            targetAmount: 5000,
            currentBalance: 500,
          }
        ]
      }
    }
  });

  // Create legacy user: jaimin
  const userJaimin = await prisma.user.create({
    data: {
      name: 'Jaimin',
      email: 'jaim@gmail.com',
      passwordHash: hashPassword('password123'),
      pin: 1413,
      accountNo: '@1Ct9B8',
      balance: 500.00,
      age: 20,
      avatarUrl: '/avatars/avatar-2.svg',
      themePreference: 'DARK',
      notificationPreference: 'ALL',
      cards: {
        create: [
          {
            cardNumber: '4111222233334444',
            expiry: '09/28',
            cvv: '123',
            status: 'FROZEN',
          }
        ]
      },
      savingsPots: {
        create: [
          {
            name: 'Vacation',
            targetAmount: 2000,
            currentBalance: 350,
          }
        ]
      }
    }
  });

  console.log('👥 Created mock users with bcrypt passwords.');

  // Add transactions for Mo
  await prisma.transaction.createMany({
    data: [
      {
        amount: 2500,
        type: 'DEPOSIT',
        category: 'SALARY',
        description: 'Initial deposit via cash deposit machine',
        status: 'SUCCESS',
        notes: 'Monthly pocket allowance',
        userId: userMo.id,
        createdAt: new Date('2026-06-01T10:00:00Z'),
      },
      {
        amount: 1000,
        type: 'TRANSFER_OUT',
        category: 'BILLS',
        description: 'Payment for web hosting service',
        receiverNo: 'hosting_biz_123',
        status: 'SUCCESS',
        notes: 'Cloud hosting VPS monthly fee',
        userId: userMo.id,
        createdAt: new Date('2026-06-03T14:30:00Z'),
      }
    ]
  });

  // Add transactions for Jaimin
  await prisma.transaction.createMany({
    data: [
      {
        amount: 5000,
        type: 'DEPOSIT',
        category: 'SALARY',
        description: 'Salary advance deposit',
        status: 'SUCCESS',
        notes: 'Freelance design project payout',
        userId: userJaimin.id,
        createdAt: new Date('2026-06-02T09:00:00Z'),
      },
      {
        amount: 4500,
        type: 'WITHDRAWAL',
        category: 'CASH',
        description: 'Cash withdrawal from ATM',
        status: 'SUCCESS',
        notes: 'Weekly cash buffer',
        userId: userJaimin.id,
        createdAt: new Date('2026-06-04T18:15:00Z'),
      }
    ]
  });

  // Add mock notifications
  await prisma.notification.createMany({
    data: [
      {
        type: 'DEPOSIT',
        title: 'Deposit Successful',
        content: '₹2,500 has been credited to your account.',
        read: true,
        userId: userMo.id,
        createdAt: new Date('2026-06-01T10:01:00Z'),
      },
      {
        type: 'CARD',
        title: 'Virtual Card Generated',
        content: 'Your new virtual Mastercard ending in 5678 is ready for use.',
        read: false,
        userId: userMo.id,
        createdAt: new Date('2026-06-01T10:05:00Z'),
      },
      {
        type: 'DEPOSIT',
        title: 'Salary Advance Credited',
        content: '₹5,000 has been credited to your account.',
        read: true,
        userId: userJaimin.id,
        createdAt: new Date('2026-06-02T09:01:00Z'),
      }
    ]
  });

  console.log('💸 Seeded transaction history logs and categories.');
  console.log('🔔 Seeded mock notifications.');
  console.log('🚀 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
