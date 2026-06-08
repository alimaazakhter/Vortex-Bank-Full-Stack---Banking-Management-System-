import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId, nickname, spendingLimit } = await request.json();

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    // Verify card exists and belongs to user
    const card = await db.virtualCard.findUnique({
      where: { id: Number(cardId) }
    });

    if (!card || card.userId !== userId) {
      return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (spendingLimit !== undefined) {
      if (isNaN(Number(spendingLimit)) || Number(spendingLimit) <= 0) {
        return NextResponse.json({ error: 'Invalid spending limit' }, { status: 400 });
      }
      updateData.spendingLimit = Number(spendingLimit);
    }

    const updatedCard = await db.virtualCard.update({
      where: { id: Number(cardId) },
      data: updateData
    });

    // Create a security/card notification
    await db.notification.create({
      data: {
        userId,
        type: 'CARD',
        title: 'Virtual Card Controls Updated',
        content: `Virtual card ending in ${card.cardNumber.slice(-4)} limits/details were modified successfully.`,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Virtual card updated successfully',
      card: updatedCard
    });

  } catch (error) {
    console.error('Update Card API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
