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

    // Toggle status
    const newStatus = card.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    const updatedCard = await db.virtualCard.update({
      where: { id: Number(cardId) },
      data: { status: newStatus }
    });

    return NextResponse.json({
      success: true,
      message: `Card successfully ${newStatus === 'ACTIVE' ? 'activated' : 'frozen'}`,
      card: updatedCard
    });

  } catch (error) {
    console.error('Toggle Card API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
