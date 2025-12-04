import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { SeedService } from '@/lib/seed/seed-service';

// POST /api/settings/reset - Reset all store data
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Double confirmation - check body for confirmation flag
    const body = await request.json();
    if (!body.confirm || body.confirm !== true) {
      return NextResponse.json(
        { error: 'Confirmation required. Set confirm: true in request body.' },
        { status: 400 }
      );
    }

    const seedService = new SeedService(user.store_id);
    const result = await seedService.resetStore();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error resetting store:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset store data' },
      { status: 500 }
    );
  }
}

