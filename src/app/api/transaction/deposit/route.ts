import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, pin } = await request.json();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Please enter a valid amount' }, { status: 400 });
    }

    const depositAmount = Number(amount);
    if (depositAmount > 10000) {
      return NextResponse.json({ error: 'Maximum deposit limit per transaction is ₹10,000' }, { status: 400 });
    }

    // Fetch user & verify PIN
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.pin !== Number(pin)) {
      return NextResponse.json({ error: 'Invalid 4-digit PIN' }, { status: 400 });
    }

    // Update user balance & log transaction inside a database transaction
    const updatedUser = await db.$transaction(async (tx) => {
      // 1. Update user balance
      const updated = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: depositAmount } }
      });

      // 2. Create transaction record
      await tx.transaction.create({
        data: {
          amount: depositAmount,
          type: 'DEPOSIT',
          category: 'CASH',
          description: 'Deposited funds via CDM',
          userId: userId
        }
      });

      // 3. Create notification record
      await tx.notification.create({
        data: {
          type: 'DEPOSIT',
          title: 'Deposit Successful',
          content: `₹${depositAmount.toLocaleString()} has been credited to your account.`,
          userId: userId
        }
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: 'Deposit successful',
      balance: updatedUser.balance
    });

  } catch (error) {
    console.error('Deposit API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
