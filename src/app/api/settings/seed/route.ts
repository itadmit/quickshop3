import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { SeedService } from '@/lib/seed/seed-service';

// POST /api/settings/seed - Import demo data
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seedService = new SeedService(user.store_id);
    const result = await seedService.seedAll();

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed demo data' },
      { status: 500 }
    );
  }
}

