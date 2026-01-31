import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const assetId = parseInt(id, 10);
    if (isNaN(assetId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        category: true,
        state: true,
        lga: true,
      },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const formattedAsset = {
      id: asset.id,
      name: asset.name,
      purchaseDate: asset.purchaseDate,
      purchaseValue: asset.purchaseValue,
      salvageValue: asset.salvageValue,
      usefulLife: asset.usefulLife,
      category_id: asset.categoryId,
      state_id: asset.stateId,
      lga_id: asset.lgaId,
      serialNumber: asset.serialNumber,
      assetCode: asset.assetCode,
      batchNumber: asset.batchNumber,
      referenceNumber: asset.referenceNumber,
      imei1: asset.imei1,
      imei2: asset.imei2,
      category: asset.category,
      state: asset.state,
      lga: asset.lga,
      category_name: asset.category?.name,
      state_name: asset.state?.name,
      lga_name: asset.lga?.name,
    };

    return NextResponse.json(formattedAsset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const assetId = parseInt(id, 10);
    if (isNaN(assetId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const {
      name, purchaseValue, purchaseDate, usefulLife, salvageValue, category_id, state_id, lga_id,
      serialNumber, batchNumber, referenceNumber, imei1, imei2
    } = body;

    const updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        name,
        purchaseValue: parseFloat(purchaseValue) || 0,
        purchaseDate: new Date(purchaseDate),
        usefulLife: parseInt(usefulLife) || 5,
        salvageValue: parseFloat(salvageValue) || 0,
        categoryId: parseInt(category_id),
        stateId: state_id ? parseInt(state_id) : undefined,
        lgaId: lga_id ? parseInt(lga_id) : undefined,
        serialNumber: serialNumber || null,
        batchNumber: batchNumber || null,
        referenceNumber: referenceNumber || null,
        imei1: imei1 || null,
        imei2: imei2 || null,
      },
      include: {
        category: true,
        state: true,
        lga: true,
      }
    });

    return NextResponse.json(updatedAsset);
  } catch (error: any) {
    console.error('Error updating asset:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const assetId = parseInt(id, 10);
    if (isNaN(assetId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.asset.delete({
      where: { id: assetId },
    });

    return NextResponse.json({ message: 'Asset deleted' });
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
