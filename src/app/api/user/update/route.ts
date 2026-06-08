import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';
import { hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'update_details') {
      const { name, email, avatarUrl } = body;

      if (!name || name.trim() === '') {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      if (!email || email.trim() === '') {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }

      // Check if email is already taken by another user
      const existingUser = await db.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json({ error: 'Email is already in use by another account' }, { status: 400 });
      }

      // Update details
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: {
          name: name.trim(),
          email: email.trim(),
          avatarUrl: avatarUrl || user.avatarUrl
        }
      });

      // Log notification
      await db.notification.create({
        data: {
          userId,
          type: 'PROFILE',
          title: 'Profile Updated',
          content: 'Your profile details have been successfully updated.'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Profile details updated successfully',
        user: {
          name: updatedUser.name,
          email: updatedUser.email,
          avatarUrl: updatedUser.avatarUrl
        }
      });
    }

    if (action === 'change_password') {
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Both current password and new password are required' }, { status: 400 });
      }

      // Verify current password
      const isPasswordValid = verifyPassword(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
      }

      // Hash and save new password
      const passwordHash = hashPassword(newPassword);
      await db.user.update({
        where: { id: userId },
        data: { passwordHash }
      });

      // Log notification
      await db.notification.create({
        data: {
          userId,
          type: 'PROFILE',
          title: 'Password Changed',
          content: 'Your account password was updated successfully.'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully'
      });
    }

    if (action === 'change_pin') {
      const { newPin } = body;

      // Validate PIN
      const parsedPin = parseInt(newPin, 10);
      if (isNaN(parsedPin) || parsedPin < 1000 || parsedPin > 9999 || newPin.toString().length !== 4) {
        return NextResponse.json({ error: 'Transaction PIN must be exactly 4 digits (1000-9999)' }, { status: 400 });
      }

      // Update PIN
      await db.user.update({
        where: { id: userId },
        data: { pin: parsedPin }
      });

      // Log notification
      await db.notification.create({
        data: {
          userId,
          type: 'PROFILE',
          title: 'Transaction PIN Updated',
          content: 'Your 4-digit transaction PIN was updated successfully.'
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Transaction PIN updated successfully'
      });
    }

    return NextResponse.json({ error: 'Invalid update action' }, { status: 400 });

  } catch (error) {
    console.error('Update profile API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
