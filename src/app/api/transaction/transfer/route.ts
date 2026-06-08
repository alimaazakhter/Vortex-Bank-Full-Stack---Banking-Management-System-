import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionId } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const userId = await getSessionId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, pin, receiverAccountNo } = await request.json();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Please enter a valid amount' }, { status: 400 });
    }

    if (!receiverAccountNo) {
      return NextResponse.json({ error: 'Receiver account number is required' }, { status: 400 });
    }

    const transferAmount = Number(amount);

    // Fetch sender and verify PIN
    const sender = await db.user.findUnique({ where: { id: userId } });
    if (!sender) {
      return NextResponse.json({ error: 'Sender account not found' }, { status: 404 });
    }

    if (sender.pin !== Number(pin)) {
      return NextResponse.json({ error: 'Invalid 4-digit PIN' }, { status: 400 });
    }

    if (sender.accountNo === receiverAccountNo) {
      return NextResponse.json({ error: 'Cannot transfer funds to your own account' }, { status: 400 });
    }

    if (sender.balance < transferAmount) {
      return NextResponse.json({ error: 'Insufficient funds for this transfer' }, { status: 400 });
    }

    // Find receiver
    const receiver = await db.user.findUnique({
      where: { accountNo: receiverAccountNo }
    });

    if (!receiver) {
      return NextResponse.json({ error: 'Recipient account number does not exist' }, { status: 404 });
    }

    // Perform database transaction for atomic double-entry updates
    const updatedSender = await db.$transaction(async (tx) => {
      // 1. Deduct sender balance
      const updated = await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: transferAmount } }
      });

      // 2. Add to receiver balance
      await tx.user.update({
        where: { id: receiver.id },
        data: { balance: { increment: transferAmount } }
      });

      // 3. Log sender's transaction
      await tx.transaction.create({
        data: {
          amount: transferAmount,
          type: 'TRANSFER_OUT',
          category: 'TRANSFER',
          description: `Transfer to ${receiver.name} (${receiver.accountNo})`,
          receiverNo: receiver.accountNo,
          userId: userId
        }
      });

      // 4. Log receiver's transaction
      await tx.transaction.create({
        data: {
          amount: transferAmount,
          type: 'TRANSFER_IN',
          category: 'TRANSFER',
          description: `Received from ${sender.name} (${sender.accountNo})`,
          senderNo: sender.accountNo,
          userId: receiver.id
        }
      });

      // 5. Log sender notification
      await tx.notification.create({
        data: {
          type: 'TRANSFER',
          title: 'Transfer Successful',
          content: `₹${transferAmount.toLocaleString()} sent successfully to ${receiver.name}.`,
          userId: userId
        }
      });

      // 6. Log receiver notification
      await tx.notification.create({
        data: {
          type: 'TRANSFER',
          title: 'Funds Received',
          content: `₹${transferAmount.toLocaleString()} received from ${sender.name}.`,
          userId: receiver.id
        }
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ₹${transferAmount} to ${receiver.name}`,
      balance: updatedSender.balance
    });

  } catch (error) {
    console.error('Transfer API error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
