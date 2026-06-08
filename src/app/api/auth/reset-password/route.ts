import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, pin, newPassword, accountNo, name, newPin } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid verification details' }, { status: 400 });
    }

    const isResettingWithAccountDetails = !!accountNo && !!name && !!newPin;

    if (isResettingWithAccountDetails) {
      // Verify account details (case-insensitive name check)
      if (
        user.accountNo !== accountNo ||
        user.name.toLowerCase() !== name.trim().toLowerCase()
      ) {
        return NextResponse.json({ error: 'Invalid account verification details' }, { status: 400 });
      }

      if (newPin.toString().length !== 4 || isNaN(Number(newPin))) {
        return NextResponse.json({ error: 'New PIN must be exactly 4 digits' }, { status: 400 });
      }

      // Hash the new password
      const newPasswordHash = hashPassword(newPassword);

      // Update password and PIN
      await db.user.update({
        where: { id: user.id },
        data: { 
          passwordHash: newPasswordHash,
          pin: Number(newPin)
        }
      });

      // Create a notification for the user
      await db.notification.create({
        data: {
          userId: user.id,
          type: 'PROFILE',
          title: 'Security Alert: Password & PIN Reset',
          content: 'Your password and transaction PIN have been successfully reset using account details verification.',
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Password and PIN reset successful. You can now sign in.'
      });

    } else {
      // Resetting using PIN
      if (pin === undefined || pin === null) {
        return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
      }

      // Verify user PIN
      if (user.pin !== Number(pin)) {
        return NextResponse.json({ error: 'Invalid email or PIN' }, { status: 400 });
      }

      // Hash the new password
      const newPasswordHash = hashPassword(newPassword);

      // Update password
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash }
      });

      // Create a notification for the user
      await db.notification.create({
        data: {
          userId: user.id,
          type: 'PROFILE',
          title: 'Security Alert: Password Reset',
          content: 'Your account password has been successfully reset using your 4-digit security PIN.',
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset successful. You can now sign in.'
      });
    }

  } catch (error) {
    console.error('Reset credentials error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
