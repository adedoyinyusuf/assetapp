'use server';

import { depreciationService } from '@/lib/depreciation/depreciation-service';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function runAnnualDepreciation(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new Error('Unauthorized');
    }
    const userId = Number(session.user.id);

    const year = Number(formData.get('year'));
    if (!year || year < 2000 || year > 2100) {
        throw new Error('Invalid year');
    }

    try {
        const result = await depreciationService.runDepreciation(year, userId);
        revalidatePath('/operations/depreciation');
        return { success: true, ...result };
    } catch (error) {
        throw new Error('Failed to run depreciation');
    }
}
