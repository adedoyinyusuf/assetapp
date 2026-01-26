'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

// Fix for default marker icons in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const customIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface AssetMapProps {
    assets: any[]; // Using any for flexibility with Prisma types for now
}

const NIGERIA_CENTER: [number, number] = [9.0820, 8.6753];
const DEFAULT_ZOOM = 6;

export default function AssetMap({ assets }: AssetMapProps) {
    // Filter assets that have coordinates
    const mappedAssets = assets.filter(a => a.latitude && a.longitude);

    if (mappedAssets.length === 0) {
        return (
            <div className="h-[500px] w-full bg-slate-100 flex items-center justify-center rounded-lg border">
                <div className="text-center">
                    <p className="text-muted-foreground mb-2">No assets have location data yet.</p>
                    <p className="text-sm text-slate-500">Verify assets with the mobile app to set GPS coordinates.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[600px] w-full rounded-lg overflow-hidden border shadow-sm z-0 relative">
            <MapContainer
                center={NIGERIA_CENTER}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {mappedAssets.map((asset) => (
                    <Marker
                        key={asset.id}
                        position={[asset.latitude, asset.longitude]}
                        icon={customIcon}
                    >
                        <Popup>
                            <div className="min-w-[200px]">
                                <h3 className="font-bold text-sm">{asset.name}</h3>
                                <div className="text-xs text-muted-foreground mt-1 mb-2">
                                    {asset.category?.name} • {asset.status}
                                </div>
                                <div className="text-xs mb-2">
                                    Coordinates: {asset.latitude.toFixed(4)}, {asset.longitude.toFixed(4)}
                                </div>
                                <Button size="sm" asChild className="w-full h-7 text-xs">
                                    <Link href={`/assets/${asset.id}`}>View Details</Link>
                                </Button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
