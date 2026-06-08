import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { potId, amount } = await request.json();

    if (!potId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid pot ID and amount are required' }, { status: 400 });
    }

    const withdrawAmount = Number(amount);

    // Fetch pot and check ownership and balance
    const pot = await db.savingsPot.findUnique({ where: { id: Number(potId) } });
    if (!pot || pot.userId !== userId) {
      return NextResponse.json({ error: 'Savings pot not found' }, { status: 404 });
    }

    if (pot.currentBalance < withdrawAmount) {
      return NextResponse.json({ error: 'Insufficient balance inside savings pot' }, { status: 400 });
    }

    // Execute atomic balance update
    const result = await db.$transaction(async (tx) => {
      // 1. Add to user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: withdrawAmount } }
      });

      // 2. Deduct from pot
      const updatedPot = await tx.savingsPot.update({
        where: { id: Number(potId) },
        data: { currentBalance: { decrement: withdrawAmount } }
      });

      // 3. Log transaction
      await tx.transaction.create({
        data: {
          amount: withdrawAmount,
          type: 'SAVINGS_WITHDRAWAL',
          category: 'SAVINGS',
          description: `Withdrew from savings goal: ${pot.name}`,
          userId
        }
      });

      // 4. Log savings notification
      await tx.notification.create({
        data: {
          type: 'SAVINGS',
          title: 'Savings Withdrawal',
          content: `Withdrew ₹${withdrawAmount.toLocaleString()} from "${pot.name}" back to wallet.`,
          userId
        }
      });

      return { updatedUser, updatedPot };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully withdrew ₹${withdrawAmount} from "${pot.name}"`,
      walletBalance: result.updatedUser.balance,
      pot: result.updatedPot
    });

  } catch (error) {
    console.error('Withdraw Pot API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
