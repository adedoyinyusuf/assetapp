'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
}

interface LocationCaptureProps {
    onLocationCapture?: (location: LocationData) => void;
    autoCapture?: boolean;
    required?: boolean;
}

export function LocationCapture({
    onLocationCapture,
    autoCapture = false,
    required = false
}: LocationCaptureProps) {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');

    // Check permission status on mount
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
                setPermissionStatus(result.state as any);
            });
        }
    }, []);

    // Auto-capture if enabled
    useEffect(() => {
        if (autoCapture && !location) {
            captureLocation();
        }
    }, [autoCapture]);

    const captureLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setIsLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const locationData: LocationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };

                setLocation(locationData);
                setIsLoading(false);
                onLocationCapture?.(locationData);
            },
            (error) => {
                setIsLoading(false);

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setError('Location permission denied. Please enable location access in your browser settings.');
                        setPermissionStatus('denied');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setError('Location information is unavailable. Please try again.');
                        break;
                    case error.TIMEOUT:
                        setError('Location request timed out. Please try again.');
                        break;
                    default:
                        setError('An unknown error occurred while getting location.');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy <= 10) return 'text-green-600 bg-green-50 border-green-200';
        if (accuracy <= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getAccuracyLabel = (accuracy: number) => {
        if (accuracy <= 10) return 'Excellent';
        if (accuracy <= 50) return 'Good';
        return 'Fair';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5" />
                    Location {required && <span className="text-red-500">*</span>}
                </CardTitle>
                <CardDescription>
                    Capture GPS coordinates for verification
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Capture Button */}
                {!location && (
                    <Button
                        onClick={captureLocation}
                        disabled={isLoading}
                        className="w-full"
                        size="lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Getting Location...
                            </>
                        ) : (
                            <>
                                <MapPin className="h-4 w-4 mr-2" />
                                Capture Current Location
                            </>
                        )}
                    </Button>
                )}

                {/* Location Display */}
                {location && (
                    <div className="space-y-3">
                        <div className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-green-900">Location Captured</p>
                                    <div className="text-xs text-green-700 space-y-0.5 font-mono">
                                        <div>Lat: {location.latitude.toFixed(6)}°</div>
                                        <div>Lng: {location.longitude.toFixed(6)}°</div>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={captureLocation}
                                className="text-green-700 hover:text-green-900"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        {/* Accuracy Badge */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Accuracy:</span>
                            <Badge variant="outline" className={getAccuracyColor(location.accuracy)}>
                                {getAccuracyLabel(location.accuracy)} (±{Math.round(location.accuracy)}m)
                            </Badge>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Permission Denied Help */}
                {permissionStatus === 'denied' && (
                    <Alert>
                        <AlertDescription className="text-xs">
                            <strong>How to enable location:</strong>
                            <ul className="mt-2 space-y-1 list-disc list-inside">
                                <li>Chrome: Click the lock icon → Site settings → Location → Allow</li>
                                <li>Safari: Settings → Privacy → Location Services → Safari → Allow</li>
                                <li>Firefox: Click the shield icon → Permissions → Location → Allow</li>
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
