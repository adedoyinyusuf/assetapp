
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { UserRole } from '@/lib/auth/roles';

export const dynamic = 'force-dynamic';


export async function GET() {
    try {
        const rolesToCreate = [
            { name: UserRole.TEAM_LEADER, description: 'Leads a verification team' },
            { name: UserRole.SENIOR_VERIFIER, description: 'Experienced verifier' },
            { name: UserRole.VERIFIER, description: 'Standard verifier' },
            { name: UserRole.ASSISTANT_VERIFIER, description: 'Assists in verification' },
            { name: UserRole.OBSERVER, description: 'Observes verification process' },
            { name: UserRole.QUALITY_CONTROLLER, description: 'Ensures verification quality' },
        ];

        const results = [];

        for (const role of rolesToCreate) {
            const existing = await prisma.userRole.findUnique({ where: { name: role.name } });
            if (!existing) {
                const created = await prisma.userRole.create({
                    data: {
                        name: role.name,
                        description: role.description
                    }
                });
                results.push({ name: role.name, status: 'created', id: created.id });
            } else {
                results.push({ name: role.name, status: 'exists', id: existing.id });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Error seeding roles:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
