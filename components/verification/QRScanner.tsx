'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, QrCode, X, ScanLine } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface QRScannerProps {
    onScanSuccess: (data: string) => void;
    onScanError?: (error: string) => void;
    title?: string;
    description?: string;
    placeholder?: string;
}

export function QRScanner({
    onScanSuccess,
    onScanError,
    title = 'Scan QR Code',
    description = 'Position the QR code within the frame to scan',
    placeholder = 'Or enter asset ID manually'
}: QRScannerProps) {
    const [manualInput, setManualInput] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cameraAvailable, setCameraAvailable] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Check camera availability
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    const hasCamera = devices.some(device => device.kind === 'videoinput');
                    setCameraAvailable(hasCamera);
                })
                .catch(() => setCameraAvailable(false));
        }
    }, []);

    const startCamera = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Use back camera on mobile
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsScanning(true);
            }
        } catch (err) {
            const errorMessage = 'Failed to access camera. Please check permissions.';
            setError(errorMessage);
            onScanError?.(errorMessage);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsScanning(false);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualInput.trim()) {
            onScanSuccess(manualInput.trim());
            setManualInput('');
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        {title}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Camera Scanner Button */}
                    {cameraAvailable && (
                        <Button
                            onClick={startCamera}
                            className="w-full"
                            size="lg"
                            disabled={isScanning}
                        >
                            <Camera className="h-4 w-4 mr-2" />
                            {isScanning ? 'Camera Active' : 'Scan with Camera'}
                        </Button>
                    )}

                    {!cameraAvailable && (
                        <Alert>
                            <AlertDescription>
                                Camera not available. Please use manual input below.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Manual Input */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-muted"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>

                    <form onSubmit={handleManualSubmit} className="flex gap-2">
                        <Input
                            type="text"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            placeholder={placeholder}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={!manualInput.trim()}>
                            Submit
                        </Button>
                    </form>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Camera Scanner Dialog */}
            <Dialog open={isScanning} onOpenChange={stopCamera}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center">
                            <span>Scanning QR Code</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={stopCamera}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />

                        {/* Scanning Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-64 h-64">
                                {/* Corner Brackets */}
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary"></div>

                                {/* Scanning Line Animation */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ScanLine className="h-full w-full text-primary opacity-50 animate-pulse" />
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded">
                                Position QR code within frame
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                        Note: QR code scanning requires additional library integration for full functionality.
                        <br />
                        Currently using manual input mode.
                    </p>
                </DialogContent>
            </Dialog>
        </div>
    );
}
