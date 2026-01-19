import { Suspense } from 'react';
import CampaignDetailClient from '../../components/CampaignDetailClient';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: {
    id: string;
  };
}

export default function CampaignDetailPage({ params }: PageProps) {
  return (
    <div className="container py-10 max-w-7xl">
      <Suspense fallback={<LoadingState />}>
        <CampaignDetailClient campaignId={params.id} />
      </Suspense>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 p-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading campaign details...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}