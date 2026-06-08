import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';

export async function GET() {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const budgets = await db.budget.findMany({
      where: { userId }
    });

    return NextResponse.json({
      success: true,
      budgets
    });

  } catch (error) {
    console.error('Fetch Budgets error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category, limit } = await request.json();

    if (!category || limit === undefined) {
      return NextResponse.json({ error: 'Category and limit are required' }, { status: 400 });
    }

    const budgetLimit = Number(limit);
    if (isNaN(budgetLimit) || budgetLimit < 0) {
      return NextResponse.json({ error: 'Limit must be a valid non-negative number' }, { status: 400 });
    }

    const upperCategory = category.toUpperCase();
    const validCategories = ['SHOPPING', 'FOOD', 'TRAVEL', 'ENTERTAINMENT', 'BILLS', 'HEALTHCARE'];
    if (!validCategories.includes(upperCategory)) {
      return NextResponse.json({ error: 'Invalid budget category' }, { status: 400 });
    }

    // Upsert budget
    const budget = await db.budget.upsert({
      where: {
        userId_category: {
          userId,
          category: upperCategory
        }
      },
      update: {
        limit: budgetLimit
      },
      create: {
        userId,
        category: upperCategory,
        limit: budgetLimit
      }
    });

    // Create notification log
    await db.notification.create({
      data: {
        userId,
        type: 'PROFILE',
        title: 'Budget Target Configured',
        content: `Your monthly limit for ${upperCategory} has been set to ₹${budgetLimit.toLocaleString()}.`,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Budget limit configured successfully',
      budget
    });

  } catch (error) {
    console.error('Configure Budget error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
