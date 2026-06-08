import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { themePreference, notificationPreference } = await request.json();

    const data: any = {};
    if (themePreference === 'DARK' || themePreference === 'LIGHT') {
      data.themePreference = themePreference;
    }
    if (notificationPreference === 'ALL' || notificationPreference === 'NONE') {
      data.notificationPreference = notificationPreference;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid preferences to update' }, { status: 400 });
    }

    // Update in database
    const updatedUser = await db.user.update({
      where: { id: userId },
      data
    });

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        themePreference: updatedUser.themePreference,
        notificationPreference: updatedUser.notificationPreference
      }
    });

  } catch (error) {
    console.error('Update preferences API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
