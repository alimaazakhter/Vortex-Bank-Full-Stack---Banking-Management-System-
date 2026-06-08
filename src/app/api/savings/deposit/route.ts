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

    const fundAmount = Number(amount);

    // Fetch user and check balance
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.balance < fundAmount) {
      return NextResponse.json({ error: 'Insufficient wallet balance to fund this pot' }, { status: 400 });
    }

    // Fetch pot and check ownership
    const pot = await db.savingsPot.findUnique({ where: { id: Number(potId) } });
    if (!pot || pot.userId !== userId) {
      return NextResponse.json({ error: 'Savings pot not found' }, { status: 404 });
    }

    // Execute atomic balance update
    const result = await db.$transaction(async (tx) => {
      // 1. Deduct from user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: fundAmount } }
      });

      // 2. Add to pot
      const updatedPot = await tx.savingsPot.update({
        where: { id: Number(potId) },
        data: { currentBalance: { increment: fundAmount } }
      });

      // 3. Log transaction
      await tx.transaction.create({
        data: {
          amount: fundAmount,
          type: 'SAVINGS_CONTRIBUTION',
          category: 'SAVINGS',
          description: `Funded savings goal: ${pot.name}`,
          userId
        }
      });

      // 4. Log savings notification
      await tx.notification.create({
        data: {
          type: 'SAVINGS',
          title: 'Savings Contribution',
          content: `Added ₹${fundAmount.toLocaleString()} to "${pot.name}".`,
          userId
        }
      });

      // 5. Goal completed check
      if (updatedPot.currentBalance >= updatedPot.targetAmount) {
        await tx.notification.create({
          data: {
            type: 'SAVINGS',
            title: 'Goal Achieved 🏆',
            content: `Congratulations! You reached your target of ₹${updatedPot.targetAmount.toLocaleString()} for "${pot.name}".`,
            userId
          }
        });
      }

      return { updatedUser, updatedPot };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ₹${fundAmount} to "${pot.name}"`,
      walletBalance: result.updatedUser.balance,
      pot: result.updatedPot
    });

  } catch (error) {
    console.error('Fund Pot API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
