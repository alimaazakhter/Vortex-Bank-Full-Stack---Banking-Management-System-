import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const notificationId = parseInt(id, 10);
    if (isNaN(notificationId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const { read } = await request.json();

    // Check ownership
    const notification = await db.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification || notification.userId !== userId) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Update read status
    const updated = await db.notification.update({
      where: { id: notificationId },
      data: { read: Boolean(read) }
    });

    return NextResponse.json({ success: true, notification: updated });

  } catch (error) {
    console.error('Update notification status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const notificationId = parseInt(id, 10);
    if (isNaN(notificationId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Check ownership
    const notification = await db.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification || notification.userId !== userId) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Delete
    await db.notification.delete({
      where: { id: notificationId }
    });

    return NextResponse.json({ success: true, message: 'Notification deleted' });

  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
