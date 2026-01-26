import { disposalService } from '@/lib/disposal/disposal-service';
import { db } from '@/lib/db';
import { DisposalDashboard } from '@/components/operations/disposal/DisposalDashboard';

export default async function DisposalPage() {
  // Fetch requests
  const requests = await disposalService.getRequests({ limit: 50 });

  // Fetch active assets eligible for disposal (not already disposed)
  // Fetch active assets eligible for disposal (not already disposed)
  // AND not currently in an active disposal request process (PENDING or APPROVED)
  const activeRequests = await db.disposalRequest.findMany({
    where: {
      status: { in: ['PENDING', 'APPROVED'] }
    },
    select: { assetId: true }
  });

  const activeDisposalAssetIds = activeRequests.map(r => r.assetId);

  const assets = await db.asset.findMany({
    where: {
      status: { not: 'DISPOSED' },
      id: { notIn: activeDisposalAssetIds }
    },
    select: {
      id: true,
      name: true,
      serialNumber: true,
      category: { select: { name: true } }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="container py-10">
      <DisposalDashboard requests={requests} assets={assets} />
    </div>
  );
}
