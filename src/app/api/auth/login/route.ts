import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { setSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json(); // identifier is either email or accountNo

    if (!identifier || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Try to find user by email or accountNo
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { accountNo: identifier }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify Password
    const passwordMatch = verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Set cookie session
    await setSession(user.id);

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        accountNo: user.accountNo,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
