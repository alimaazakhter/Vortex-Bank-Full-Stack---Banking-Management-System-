import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';
import { generateCardNumber, generateExpiry, generateCVV } from '@/lib/utils';

export async function POST() {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check count of user cards
    const cardCount = await db.virtualCard.count({
      where: { userId }
    });

    if (cardCount >= 3) {
      return NextResponse.json({ error: 'You have reached the maximum limit of 3 virtual cards' }, { status: 400 });
    }

    // Generate unique card details
    let cardNumber = generateCardNumber();
    let cardExists = true;
    while (cardExists) {
      const checkCard = await db.virtualCard.findUnique({ where: { cardNumber } });
      if (!checkCard) {
        cardExists = false;
      } else {
        cardNumber = generateCardNumber();
      }
    }

    const expiry = generateExpiry();
    const cvv = generateCVV();

    // Save to database
    const card = await db.virtualCard.create({
      data: {
        cardNumber,
        expiry,
        cvv,
        status: 'ACTIVE',
        userId
      }
    });

    // Log notification
    await db.notification.create({
      data: {
        type: 'CARD',
        title: 'Virtual Card Generated',
        content: `Your new virtual card ending in ${cardNumber.slice(-4)} is ready for use.`,
        userId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Virtual card generated successfully',
      card
    });

  } catch (error) {
    console.error('Create Card API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
