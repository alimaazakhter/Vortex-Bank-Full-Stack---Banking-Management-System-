import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { potId } = await request.json();
    if (!potId) {
      return NextResponse.json({ error: 'Pot ID is required' }, { status: 400 });
    }

    // Fetch pot and check ownership
    const pot = await db.savingsPot.findUnique({ where: { id: Number(potId) } });
    if (!pot || pot.userId !== userId) {
      return NextResponse.json({ error: 'Savings pot not found' }, { status: 404 });
    }

    const refundAmount = pot.currentBalance;

    // Refund and delete inside transaction
    await db.$transaction(async (tx) => {
      // 1. If there's balance, refund to wallet
      if (refundAmount > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: refundAmount } }
        });

        // Log transaction
        await tx.transaction.create({
          data: {
            amount: refundAmount,
            type: 'TRANSFER_IN',
            description: `Refunded from deleted goal: ${pot.name}`,
            userId
          }
        });
      }

      // 2. Delete pot
      await tx.savingsPot.delete({
        where: { id: Number(potId) }
      });

      // 3. Log notification
      await tx.notification.create({
        data: {
          type: 'SAVINGS',
          title: 'Savings Pot Deleted',
          content: `Savings pot "${pot.name}" was deleted.${refundAmount > 0 ? ` ₹${refundAmount.toLocaleString()} has been refunded to your wallet.` : ''}`,
          userId
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: `Savings pot deleted.${refundAmount > 0 ? ` Refunded ₹${refundAmount} to your wallet.` : ''}`
    });

  } catch (error) {
    console.error('Delete Pot API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
