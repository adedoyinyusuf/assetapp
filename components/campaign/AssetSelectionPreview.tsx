'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Package, MapPin, Tag } from 'lucide-react';

interface Asset {
    id: number;
    name: string;
    serialNumber?: string;
    category: {
        name: string;
    };
    state?: {
        name: string;
    };
    lga?: {
        name: string;
    };
    purchaseValue?: number;
}

interface AssetSelectionPreviewProps {
    selectedAssets: Asset[];
    onRemove: (assetId: number) => void;
    maxHeight?: string;
}

export function AssetSelectionPreview({
    selectedAssets,
    onRemove,
    maxHeight = '400px'
}: AssetSelectionPreviewProps) {
    if (selectedAssets.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Selected Assets
                        </span>
                        <Badge variant="secondary">0 selected</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No assets selected yet</p>
                        <p className="text-xs mt-1">Use the dropdown above to select assets for verification</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Selected Assets
                    </span>
                    <Badge variant="secondary">{selectedAssets.length} selected</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    className="space-y-2 overflow-y-auto pr-2"
                    style={{ maxHeight }}
                >
                    {selectedAssets.map((asset) => (
                        <div
                            key={asset.id}
                            className="flex items-start justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                                    <Package className="h-4 w-4 text-primary" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate">{asset.name}</h4>

                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        <Badge variant="outline" className="text-xs">
                                            <Tag className="h-3 w-3 mr-1" />
                                            {asset.category.name}
                                        </Badge>

                                        {asset.state && (
                                            <Badge variant="outline" className="text-xs">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {asset.state.name}
                                                {asset.lga && `, ${asset.lga.name}`}
                                            </Badge>
                                        )}

                                        {asset.serialNumber && (
                                            <span className="text-xs text-muted-foreground font-mono">
                                                #{asset.serialNumber}
                                            </span>
                                        )}
                                    </div>

                                    {asset.purchaseValue && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Value: ₦{asset.purchaseValue.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={() => onRemove(asset.id)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                {selectedAssets.length > 5 && (
                    <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground text-center">
                            Scroll to see all {selectedAssets.length} assets
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
