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

    const withdrawAmount = Number(amount);

    // Fetch user & verify PIN and balance
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.pin !== Number(pin)) {
      return NextResponse.json({ error: 'Invalid 4-digit PIN' }, { status: 400 });
    }

    if (user.balance < withdrawAmount) {
      return NextResponse.json({ error: 'Insufficient funds for this withdrawal' }, { status: 400 });
    }

    // Update user balance & log transaction inside database transaction
    const updatedUser = await db.$transaction(async (tx) => {
      // 1. Deduct user balance
      const updated = await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: withdrawAmount } }
      });

      // 2. Create transaction record
      await tx.transaction.create({
        data: {
          amount: withdrawAmount,
          type: 'WITHDRAWAL',
          category: 'CASH',
          description: 'Cash withdrawal from ATM',
          userId: userId
        }
      });

      // 3. Create notification record
      await tx.notification.create({
        data: {
          type: 'WITHDRAWAL',
          title: 'Withdrawal Successful',
          content: `₹${withdrawAmount.toLocaleString()} has been withdrawn from your account.`,
          userId: userId
        }
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal successful',
      balance: updatedUser.balance
    });

  } catch (error) {
    console.error('Withdrawal API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
