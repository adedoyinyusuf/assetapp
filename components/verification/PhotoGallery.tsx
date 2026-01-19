'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import Image from 'next/image';

interface Photo {
    id: number;
    url: string;
    caption?: string;
    uploadedAt?: string;
    uploadedBy?: string;
}

interface PhotoGalleryProps {
    photos: Photo[];
    onDelete?: (photoId: number) => void;
    allowDelete?: boolean;
}

export function PhotoGallery({ photos, onDelete, allowDelete = false }: PhotoGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [zoom, setZoom] = useState(1);

    const openLightbox = (index: number) => {
        setSelectedIndex(index);
        setZoom(1);
    };

    const closeLightbox = () => {
        setSelectedIndex(null);
        setZoom(1);
    };

    const goToPrevious = () => {
        if (selectedIndex !== null && selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1);
            setZoom(1);
        }
    };

    const goToNext = () => {
        if (selectedIndex !== null && selectedIndex < photos.length - 1) {
            setSelectedIndex(selectedIndex + 1);
            setZoom(1);
        }
    };

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));

    const handleDownload = (url: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = url.split('/').pop() || 'photo.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (photos.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No photos available</p>
            </div>
        );
    }

    const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;

    return (
        <>
            {/* Photo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                    <div
                        key={photo.id}
                        className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg border bg-muted"
                        onClick={() => openLightbox(index)}
                    >
                        <Image
                            src={photo.url}
                            alt={photo.caption || `Photo ${index + 1}`}
                            fill
                            className="object-cover transition-transform group-hover:scale-110"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {allowDelete && onDelete && (
                            <Button
                                size="icon"
                                variant="destructive"
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(photo.id);
                                }}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox Dialog */}
            <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
                <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden">
                    {selectedPhoto && selectedIndex !== null && (
                        <div className="relative h-full flex flex-col bg-black">
                            {/* Header */}
                            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
                                <div className="flex justify-between items-start text-white">
                                    <div>
                                        {selectedPhoto.caption && (
                                            <p className="font-medium">{selectedPhoto.caption}</p>
                                        )}
                                        {selectedPhoto.uploadedAt && (
                                            <p className="text-xs text-white/70 mt-1">
                                                {new Date(selectedPhoto.uploadedAt).toLocaleString()}
                                                {selectedPhoto.uploadedBy && ` • by ${selectedPhoto.uploadedBy}`}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-white hover:bg-white/20"
                                        onClick={closeLightbox}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Image Container */}
                            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                                <div style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s' }}>
                                    <Image
                                        src={selectedPhoto.url}
                                        alt={selectedPhoto.caption || 'Photo'}
                                        width={1200}
                                        height={800}
                                        className="max-w-full h-auto"
                                    />
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4">
                                <div className="flex justify-center items-center gap-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-white hover:bg-white/20"
                                        onClick={goToPrevious}
                                        disabled={selectedIndex === 0}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>

                                    <div className="flex gap-1 mx-4">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-white hover:bg-white/20"
                                            onClick={handleZoomOut}
                                            disabled={zoom <= 0.5}
                                        >
                                            <ZoomOut className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-white hover:bg-white/20"
                                            onClick={handleZoomIn}
                                            disabled={zoom >= 3}
                                        >
                                            <ZoomIn className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-white hover:bg-white/20"
                                            onClick={() => handleDownload(selectedPhoto.url)}
                                        >
                                            <Download className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-white hover:bg-white/20"
                                        onClick={goToNext}
                                        disabled={selectedIndex === photos.length - 1}
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </div>
                                <p className="text-center text-white/70 text-sm mt-2">
                                    {selectedIndex + 1} / {photos.length}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
