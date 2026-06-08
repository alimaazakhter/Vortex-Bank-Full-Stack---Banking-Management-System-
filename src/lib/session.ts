import { cookies } from 'next/headers';
import { db } from './db';

const COOKIE_NAME = 'vortex_session_user_id';

export async function setSession(userId: number) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

export async function getSessionId(): Promise<number | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;
  const val = parseInt(cookie.value, 10);
  return isNaN(val) ? null : val;
}

export async function getCurrentUser() {
  const userId = await getSessionId();
  if (!userId) return null;
  
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        cards: true,
        savingsPots: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 15
        }
      }
    });
    return user;
  } catch (e) {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
