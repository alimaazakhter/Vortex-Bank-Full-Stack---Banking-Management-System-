import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, targetAmount } = await request.json();

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Goal name is required' }, { status: 400 });
    }

    if (!targetAmount || isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      return NextResponse.json({ error: 'Please enter a valid target amount' }, { status: 400 });
    }

    // Save to database
    const pot = await db.savingsPot.create({
      data: {
        name: name.trim(),
        targetAmount: Number(targetAmount),
        currentBalance: 0,
        userId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Savings pot created successfully',
      pot
    });

  } catch (error) {
    console.error('Create Pot API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
