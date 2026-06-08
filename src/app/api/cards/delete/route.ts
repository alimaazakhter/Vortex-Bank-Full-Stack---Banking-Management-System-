import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cardId } = await request.json();
    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    // Find card and check ownership
    const card = await db.virtualCard.findUnique({
      where: { id: Number(cardId) }
    });

    if (!card || card.userId !== userId) {
      return NextResponse.json({ error: 'Card not found or access denied' }, { status: 404 });
    }

    // Delete card
    await db.virtualCard.delete({
      where: { id: Number(cardId) }
    });

    // Log notification
    await db.notification.create({
      data: {
        type: 'CARD',
        title: 'Virtual Card Terminated',
        content: `Your virtual card ending in ${card.cardNumber.slice(-4)} has been deleted.`,
        userId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Virtual card successfully terminated'
    });

  } catch (error) {
    console.error('Delete Card API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
