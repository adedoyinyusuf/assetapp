import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { UserRole } from '@/lib/auth/roles';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is available or use random string

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const summary = searchParams.get('summary') === 'true';

    if (summary) {
      // 1. Fetch summary stats
      const [assetStats, catStats, recentAssets] = await Promise.all([
        // Total count and value
        prisma.asset.aggregate({
          _count: { id: true },
          _sum: { purchaseValue: true },
        }),
        // Category stats
        prisma.category.findMany({
          include: {
            _count: { select: { assets: true } },
            assets: { select: { purchaseValue: true } },
          },
        }),
        // Recent assets
        prisma.asset.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { category: true },
        }),
      ]);

      const formattedCatStats = catStats.map((c) => ({
        name: c.name,
        count: c._count.assets,
        value: c.assets.reduce((sum, a) => sum + (a.purchaseValue || 0), 0),
      }));

      return NextResponse.json({
        summary: {
          totalAssets: assetStats._count.id,
          totalValue: assetStats._sum.purchaseValue || 0,
          categories: formattedCatStats,
          recentAssets: recentAssets.map((a) => ({
            id: a.id,
            name: a.name,
            purchaseValue: a.purchaseValue,
            purchaseDate: a.purchaseDate,
            category: a.category?.name,
          })),
        },
      });
    }

    // 2. Default List with pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = (page - 1) * limit;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          state: true,
          lga: true,
        },
      }),
      prisma.asset.count(),
    ]);

    const formattedAssets = assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      purchaseDate: asset.purchaseDate,
      purchaseValue: asset.purchaseValue,
      salvageValue: asset.salvageValue,
      usefulLife: asset.usefulLife,
      category_id: asset.categoryId,
      state_id: asset.stateId,
      lga_id: asset.lgaId,
      // Identity Fields
      serialNumber: asset.serialNumber,
      assetCode: asset.assetCode,
      batchNumber: asset.batchNumber,
      referenceNumber: asset.referenceNumber,
      imei1: asset.imei1,
      imei2: asset.imei2,
      // Full objects
      category: asset.category,
      state: asset.state,
      lga: asset.lga,
      // Legacy fields
      category_name: asset.category?.name,
      state_name: asset.state?.name,
      lga_name: asset.lga?.name,
      // Verification
      lastVerificationStatus: asset.lastVerificationStatus,
      lastVerifiedAt: asset.lastVerifiedAt,
    }));

    return NextResponse.json({
      data: formattedAssets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER].includes(session.user.role)) {
      // Note: Manager usually allowed in asset systems, checking server.js didn't show auth middleware,
      // but typically we should protect writes. Adhering to likely requirements.
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, purchaseDate, purchaseValue, salvageValue, usefulLife, category_id, state_id, lga_id,
      serialNumber, batchNumber, referenceNumber, imei1, imei2, imageUrl
    } = body;

    // Handle Image Upload if base64 provided
    let savedImageUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith('data:image')) {
      try {
        // Extract base64 data
        const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (matches && matches.length === 3) {
          const imageType = matches[1];
          const imageBuffer = Buffer.from(matches[2], 'base64');

          // Determine extension
          let extension = 'jpg';
          if (imageType.includes('png')) extension = 'png';
          else if (imageType.includes('jpeg')) extension = 'jpeg';
          else if (imageType.includes('webp')) extension = 'webp';

          // Create directory if not exists
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'assets');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          // Generate filename and save
          const filename = `asset-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;
          const filepath = path.join(uploadDir, filename);

          fs.writeFileSync(filepath, imageBuffer);
          savedImageUrl = `/uploads/assets/${filename}`;
        }
      } catch (e) {
        console.error("Error saving image:", e);
        // Continue without saving image if it fails, or maybe throw? 
        // We'll keep the base64 or null? Better to set null if failed.
        savedImageUrl = null;
      }
    }

    // Validate required fields
    if (!name || !purchaseDate || purchaseValue === undefined || !category_id || !state_id || !lga_id) {
      return NextResponse.json({
        error: 'Missing required fields. Name, purchase date, value, category, state, and LGA are required.'
      }, { status: 400 });
    }

    // Transaction for creation
    const newAsset = await prisma.$transaction(async (tx) => {
      // Generate Asset Code
      const count = await tx.asset.count();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const assetCode = `AST-${Date.now().toString().slice(-6)}-${count + 1}-${randomSuffix}`;

      // Create Asset
      return tx.asset.create({
        data: {
          name,
          purchaseDate: new Date(purchaseDate),
          purchaseValue: parseFloat(purchaseValue) || 0,
          currentValue: parseFloat(purchaseValue) || 0, // Initial current value = purchase value
          salvageValue: parseFloat(salvageValue) || 0,
          usefulLife: parseInt(usefulLife) || 5,
          categoryId: parseInt(category_id),
          stateId: parseInt(state_id),
          lgaId: parseInt(lga_id),
          serialNumber: serialNumber || undefined,
          assetCode,
          batchNumber: batchNumber || undefined,
          referenceNumber: referenceNumber || undefined,
          imei1: imei1 || undefined,

          imei2: imei2 || undefined,
          imageUrl: savedImageUrl || undefined,
        },
        include: {
          category: true,
          state: true,
          lga: true,
        },
      });
    });

    const formattedAsset = {
      id: newAsset.id,
      name: newAsset.name,
      purchaseDate: newAsset.purchaseDate,
      purchaseValue: newAsset.purchaseValue,
      salvageValue: newAsset.salvageValue,
      usefulLife: newAsset.usefulLife,
      category_id: newAsset.categoryId,
      state_id: newAsset.stateId,
      lga_id: newAsset.lgaId,
      serialNumber: newAsset.serialNumber,
      assetCode: newAsset.assetCode,
      batchNumber: newAsset.batchNumber,
      referenceNumber: newAsset.referenceNumber,
      imei1: newAsset.imei1,

      imei2: newAsset.imei2,
      imageUrl: newAsset.imageUrl,
      category: (newAsset as any).category,
      state: (newAsset as any).state,
      lga: (newAsset as any).lga,
      category_name: (newAsset as any).category?.name,
      state_name: (newAsset as any).state?.name,
      lga_name: (newAsset as any).lga?.name,
    };

    return NextResponse.json(formattedAsset, { status: 201 });

  } catch (error: any) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: `Database Error: ${error.message}` }, { status: 500 });
  }
}
