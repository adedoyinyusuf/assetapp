'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Printer, QrCode } from 'lucide-react';

interface AssetLabelModalProps {
    asset: {
        id: number;
        name: string;
        serialNumber?: string | null;
        tagNumber?: string; // If you have a specific asset tag number
    };
}

export function AssetLabelModal({ asset }: AssetLabelModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    // The URL encoded in the QR code.
    // In production, this should be the full domain. Using window.location.origin if available, or relative.
    // Ideally points to a verification or detail page.
    const qrValue = `${typeof window !== 'undefined' ? window.location.origin : ''}/assets/${asset.id}`;

    const handlePrint = () => {
        // Create a temporary iframe or just print the specific div content logic
        // For simplicity, we'll open a print window or use simple print styles
        const printContent = document.getElementById('printable-label');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); // Reload to restore event listeners/state
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <QrCode className="h-4 w-4" />
                    Generate Label
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Asset Tag Generation</DialogTitle>
                    <DialogDescription>
                        Print this label to attach to the physical asset.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-6 space-y-6">
                    {/* Printable Area - Modeled as a standard asset sticker */}
                    <div
                        id="printable-label"
                        className="border-2 border-black p-4 rounded-lg w-64 h-auto flex flex-col items-center bg-white"
                        style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} // Force background printing
                    >
                        <div className="text-xs font-bold uppercase tracking-wider mb-2">Property of Company</div>

                        <div className="bg-white p-2">
                            <QRCode
                                size={120}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={qrValue}
                                viewBox={`0 0 256 256`}
                                level="H" // High error correction
                            />
                        </div>

                        <div className="mt-2 text-center">
                            <div className="font-bold text-lg leading-none">{asset.name.substring(0, 20)}{asset.name.length > 20 ? '...' : ''}</div>
                            <div className="text-sm font-mono mt-1">ID: {asset.id.toString().padStart(6, '0')}</div>
                            {asset.serialNumber && (
                                <div className="text-xs text-gray-500 mt-0.5">S/N: {asset.serialNumber}</div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 w-full">
                        <Button onClick={handlePrint} className="w-full gap-2">
                            <Printer className="h-4 w-4" />
                            Print Label
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
