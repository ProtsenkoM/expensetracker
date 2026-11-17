import { NextRequest } from 'next/server';
import { handleAuth } from '@/features/auth/server';

export function POST(request: NextRequest) {
  return handleAuth(request, 'login');
}
