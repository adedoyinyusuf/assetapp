'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { ExportDialog } from '@/components/export/ExportDialog';

export function CampaignListActions({ showCreateButton }: { showCreateButton: boolean }) {
    const [exportDialogOpen, setExportDialogOpen] = useState(false);

    return (
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>

            {showCreateButton && (
                <Link href="/stock-verification/campaigns/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Campaign
                    </Button>
                </Link>
            )}

            <ExportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                dataType="campaigns"
                title="Export Campaigns"
            />
        </div>
    );
}
