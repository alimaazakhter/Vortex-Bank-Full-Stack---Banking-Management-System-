import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { setSession } from '@/lib/session';
import { generateAccountNo } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { name, email, password, pin, age } = await request.json();

    // Validations
    if (!name || !email || !password || !pin || !age) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (age < 18) {
      return NextResponse.json({ error: 'You must be at least 18 years old' }, { status: 400 });
    }

    if (String(pin).length !== 4 || isNaN(Number(pin))) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    // Check existing email
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
    }

    // Generate unique account number
    let accountNo = generateAccountNo();
    let accountExists = true;
    while (accountExists) {
      const checkAcc = await db.user.findUnique({ where: { accountNo } });
      if (!checkAcc) {
        accountExists = false;
      } else {
        accountNo = generateAccountNo();
      }
    }

    // Hash password & create user
    const passwordHash = hashPassword(password);
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        pin: Number(pin),
        accountNo,
        balance: 1000.0, // Friendly opening balance for new register
        age: Number(age)
      }
    });

    // Create a first mock transaction: Opening Balance
    await db.transaction.create({
      data: {
        amount: 1000.0,
        type: 'DEPOSIT',
        category: 'SALARY',
        description: 'Vortex Sign-up Welcome Bonus',
        userId: user.id
      }
    });

    // Set cookie session
    await setSession(user.id);

    return NextResponse.json({
      success: true,
      message: 'Account registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        accountNo: user.accountNo,
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
