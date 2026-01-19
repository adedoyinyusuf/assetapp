'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface QRScannerProps {
    onScan: (result: string) => void;
    onClose?: () => void;
    className?: string;
}

const QR_ELEMENT_ID = "reader";

export default function QRScanner({ onScan, onClose, className = '' }: QRScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scannedCode, setScannedCode] = useState<string | null>(null);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const mountedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            // Force cleanup on unmount
            cleanupScanner();
        };
    }, []);

    // Effect to handle scanner initialization when 'scanning' state changes
    useEffect(() => {
        if (scanning) {
            initScanner();
        } else {
            cleanupScanner();
        }
    }, [scanning]);

    const cleanupScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop();
                }
                html5QrCodeRef.current.clear();
            } catch (err) {
                console.error("Failed to stop/clear scanner", err);
            }
            html5QrCodeRef.current = null;
        }
    };

    const initScanner = async () => {
        setLoading(true);
        setError(null);

        // Give a brief timeout to ensure DOM element is rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const element = document.getElementById(QR_ELEMENT_ID);
            if (!element) {
                throw new Error("Scanner element not found in DOM");
            }

            // Cleanup any existing instance just in case
            if (html5QrCodeRef.current) {
                await cleanupScanner();
            }

            const qrCode = new Html5Qrcode(QR_ELEMENT_ID, {
                verbose: false,
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
            });

            html5QrCodeRef.current = qrCode;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await qrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    if (mountedRef.current) {
                        handleScanSuccess(decodedText);
                    }
                },
                (errorMessage) => {
                    // Ignore scan errors as they happen every frame no code is detected
                }
            );
        } catch (err: any) {
            console.error('Error starting camera:', err);
            if (mountedRef.current) {
                setError(err.message || 'Failed to start camera. Please check permissions.');
                setScanning(false);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    };

    const startScanning = () => {
        setScanning(true);
    };

    const stopScanning = () => {
        setScanning(false);
    };

    const handleScanSuccess = (code: string) => {
        setScannedCode(code);
        setScanning(false); // This will trigger cleanupVia useEffect
        onScan(code);
    };

    const handleManualInput = (value: string) => {
        if (value.trim()) {
            setScannedCode(value.trim());
            onScan(value.trim());
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {scannedCode && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        Scanned: <strong>{scannedCode}</strong>
                    </AlertDescription>
                </Alert>
            )}

            {scanning ? (
                <div className="relative border-2 border-primary rounded-lg overflow-hidden bg-black min-h-[300px] flex items-center justify-center">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 text-white">
                            <Loader2 className="w-8 h-8 animate-spin mr-2" />
                            <span>Starting Camera...</span>
                        </div>
                    )}
                    <div id={QR_ELEMENT_ID} className="w-full h-full" />

                    {!loading && (
                        <div className="absolute bottom-4 left-0 right-0 p-4 flex justify-center gap-2 pointer-events-auto z-20">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={stopScanning}
                                className="w-full max-w-xs bg-red-600 hover:bg-red-700 text-white"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Stop Scanning
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="border-2 border-dashed rounded-lg p-8 bg-muted/50 dark:bg-muted/10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-primary" />
                        </div>
                        <div className="text-center w-full max-w-sm">
                            <p className="text-sm font-medium mb-2">QR Code Scanner</p>
                            <p className="text-xs text-muted-foreground mb-4">
                                Click start to scan QR code with your camera
                            </p>
                            <Button
                                type="button"
                                onClick={startScanning}
                                className="mb-4 w-full"
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Start Camera Scanner
                            </Button>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter ASSET ID..."
                                    className="flex-1 px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleManualInput(e.currentTarget.value);
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={(e) => {
                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                        handleManualInput(input.value);
                                    }}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {onClose && (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="w-full"
                >
                    Close Scanner Panel
                </Button>
            )}
        </div>
    );
}
