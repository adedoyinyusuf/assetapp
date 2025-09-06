import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server-prisma';

export async function GET() {
  try {
    const categories = await prisma.$queryRaw<Array<{
      id: number;
      name: string;
      description: string | null;
      created_at: Date;
      updated_at: Date;
    }>>`
      SELECT id, name, description, created_at, updated_at 
      FROM categories 
      ORDER BY name ASC
    `;
    
    const formattedCategories = categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || undefined,
      defaultUsefulLifeYears: 5, // Default value since it's not in the DB schema
      parent_id: undefined,
      created_at: new Date(cat.created_at).toISOString(),
      updated_at: new Date(cat.updated_at).toISOString()
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
