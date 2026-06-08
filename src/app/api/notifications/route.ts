import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';

export async function GET() {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ success: true, notifications });

  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mark all as read
    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });

    return NextResponse.json({ success: true, message: 'All notifications marked as read' });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
