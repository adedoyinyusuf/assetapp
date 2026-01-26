'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignAssetCustody(assetId: number, targetUserId: number, notes?: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        throw new Error("Unauthorized");
    }

    // Get current user (assigner)
    const assigner = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!assigner) throw new Error("Assigner not found");

    try {
        // 1. Update Asset
        // 2. Create Custody Log

        // Check if valid user
        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) throw new Error("Target user not found");

        const result = await (prisma as any).$transaction(async (tx: any) => {
            const asset = await tx.asset.update({
                where: { id: assetId },
                data: {
                    assignedToUserId: targetUserId,
                    status: 'IN_USE' // Automatically set to IN_USE
                }
            });

            await tx.custodyLog.create({
                data: {
                    assetId: assetId,
                    userId: targetUserId,
                    assignedBy: assigner.id,
                    notes: notes,
                    assignedAt: new Date(),
                }
            });

            return asset;
        });

        revalidatePath(`/assets/${assetId}`);
        return { success: true, asset: result };
    } catch (error) {
        console.error("Failed to assign custody:", error);
        return { success: false, error: "Failed to assign custody" };
    }
}

export async function releaseAssetCustody(assetId: number) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    try {
        await (prisma.asset as any).update({
            where: { id: assetId },
            data: {
                assignedToUserId: null,
                status: 'IN_STORE' // Return to store
            }
        });

        // Optionally log the release? The current schema doesn't have a specific "Release" log type, 
        // but we could add a log entry assigned to the system or null if allowed, 
        // but strictly the schema requires a user. 
        // For now, we just clear the current assignment.

        revalidatePath(`/assets/${assetId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to release custody" };
    }
}

export async function searchUsers(query: string) {
    if (!query || query.length < 2) return [];

    return await prisma.user.findMany({
        where: {
            OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
            ],
            isActive: true
        },
        take: 5,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true
        }
    });
}
