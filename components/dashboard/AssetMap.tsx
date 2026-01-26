'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { useEffect, useState } from 'react';

// Fix for default marker icon in Next.js
const defaultIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface AssetMapProps {
    assets: any[];
}

export default function AssetMap({ assets }: AssetMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg" />;
    }

    // Default center (Nigeria)
    const center: [number, number] = [9.0820, 8.6753];

    // Filter assets with valid coordinates
    // Note: Schema has latitude/longitude as Float?
    const validAssets = assets.filter(a => a.latitude && a.longitude);

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden border border-border shadow-sm">
            <MapContainer
                center={center}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {validAssets.map(asset => (
                    <Marker
                        key={asset.id}
                        position={[asset.latitude, asset.longitude]}
                        icon={defaultIcon}
                    >
                        <Popup>
                            <div className="p-2">
                                <h3 className="font-bold">{asset.name}</h3>
                                <p className="text-sm text-gray-600">{asset.category?.name}</p>
                                <p className="text-xs mt-1">Status: {asset.status}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
