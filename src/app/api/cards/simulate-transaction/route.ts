import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId, amount, category, description } = await request.json();

    if (!cardId || !amount || !category || !description) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than zero' }, { status: 400 });
    }

    // 1. Fetch user to check wallet balance
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.balance < payAmount) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    // 2. Fetch the virtual card
    const card = await db.virtualCard.findUnique({
      where: { id: Number(cardId) }
    });

    if (!card || card.userId !== userId) {
      return NextResponse.json({ error: 'Virtual card not found' }, { status: 404 });
    }

    if (card.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This card is currently frozen' }, { status: 400 });
    }

    // 3. Calculate current month's spending on this card to check spending limit
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTransactions = await db.transaction.findMany({
      where: {
        cardId: card.id,
        createdAt: { gte: startOfMonth }
      }
    });

    const currentMonthlySpending = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);

    if (currentMonthlySpending + payAmount > card.spendingLimit) {
      return NextResponse.json({
        error: `Transaction declined. Exceeds card remaining limit of ₹${(card.spendingLimit - currentMonthlySpending).toLocaleString()}`
      }, { status: 400 });
    }

    // 4. Update database inside a transaction (Prisma transaction)
    const [updatedUser, newTransaction] = await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { balance: { decrement: payAmount } }
      }),
      db.transaction.create({
        data: {
          userId,
          amount: payAmount,
          type: 'WITHDRAWAL',
          category: category.toUpperCase(),
          description: description,
          cardId: card.id,
          status: 'SUCCESS'
        }
      })
    ]);

    // 5. Send notification log
    await db.notification.create({
      data: {
        userId,
        type: 'CARD',
        title: 'Virtual Card Payment Succeeded',
        content: `Paid ₹${payAmount.toLocaleString()} at ${description} using card ending in ${card.cardNumber.slice(-4)}.`,
      }
    });

    // Check if user has a budget for this category and is exceeding it
    const budget = await db.budget.findUnique({
      where: {
        userId_category: {
          userId,
          category: category.toUpperCase()
        }
      }
    });

    if (budget) {
      // Calculate total category spending for this month
      const categoryTransactions = await db.transaction.findMany({
        where: {
          userId,
          category: category.toUpperCase(),
          type: 'WITHDRAWAL',
          createdAt: { gte: startOfMonth }
        }
      });
      const totalCategorySpent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);

      if (totalCategorySpent > budget.limit) {
        await db.notification.create({
          data: {
            userId,
            type: 'PROFILE',
            title: `Budget Alert: ${category.toUpperCase()}`,
            content: `You have exceeded your monthly budget limit of ₹${budget.limit.toLocaleString()} for ${category.toUpperCase()}. Spent: ₹${totalCategorySpent.toLocaleString()}.`,
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Card payment simulated successfully',
      balance: updatedUser.balance,
      transaction: newTransaction
    });

  } catch (error) {
    console.error('Simulate Card Transaction API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
