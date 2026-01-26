'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AddDevicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        imei_1: '',
        imei_2: '',
        device_name: '',
        serial_number: '',
        manufacturer: '',
        model: '',
        os_type: 'Android',
        os_version: '',
        purchase_date: '',
        purchase_value: '',
        warranty_expiry: '',
        carrier: ''
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/mdm/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    purchase_value: formData.purchase_value ? parseFloat(formData.purchase_value) : null,
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create device');
            }

            const device = await res.json();
            router.push(`/mdm/devices/${device.id}`);
        } catch (error: any) {
            alert(`Error: ${error.message}`);
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/mdm/devices">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Register New Device</h1>
                    <p className="text-muted-foreground">Add a mobile device to the MDM system</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Device Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Device Identity */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700">Device Identity</h3>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="imei_1">IMEI 1 *</Label>
                                    <Input
                                        id="imei_1"
                                        required
                                        maxLength={15}
                                        value={formData.imei_1}
                                        onChange={(e) => handleChange('imei_1', e.target.value)}
                                        placeholder="123456789012345"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="imei_2">IMEI 2 (Dual SIM)</Label>
                                    <Input
                                        id="imei_2"
                                        maxLength={15}
                                        value={formData.imei_2}
                                        onChange={(e) => handleChange('imei_2', e.target.value)}
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="serial_number">Serial Number</Label>
                                    <Input
                                        id="serial_number"
                                        value={formData.serial_number}
                                        onChange={(e) => handleChange('serial_number', e.target.value)}
                                        placeholder="SN123456"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="device_name">Device Name</Label>
                                    <Input
                                        id="device_name"
                                        value={formData.device_name}
                                        onChange={(e) => handleChange('device_name', e.target.value)}
                                        placeholder="John's iPhone"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Device Specifications */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700">Specifications</h3>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="manufacturer">Manufacturer</Label>
                                    <Input
                                        id="manufacturer"
                                        value={formData.manufacturer}
                                        onChange={(e) => handleChange('manufacturer', e.target.value)}
                                        placeholder="Apple, Samsung, etc."
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="model">Model</Label>
                                    <Input
                                        id="model"
                                        value={formData.model}
                                        onChange={(e) => handleChange('model', e.target.value)}
                                        placeholder="iPhone 15, Galaxy S24, etc."
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="os_type">Operating System</Label>
                                    <Select value={formData.os_type} onValueChange={(value) => handleChange('os_type', value)}>
                                        <SelectTrigger id="os_type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="iOS">iOS</SelectItem>
                                            <SelectItem value="Android">Android</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="os_version">OS Version</Label>
                                    <Input
                                        id="os_version"
                                        value={formData.os_version}
                                        onChange={(e) => handleChange('os_version', e.target.value)}
                                        placeholder="17.2, Android 14, etc."
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="carrier">Carrier</Label>
                                <Input
                                    id="carrier"
                                    value={formData.carrier}
                                    onChange={(e) => handleChange('carrier', e.target.value)}
                                    placeholder="MTN, Airtel, Glo, etc."
                                />
                            </div>
                        </div>

                        {/* Purchase Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-700">Purchase Information</h3>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="purchase_date">Purchase Date</Label>
                                    <Input
                                        id="purchase_date"
                                        type="date"
                                        value={formData.purchase_date}
                                        onChange={(e) => handleChange('purchase_date', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="purchase_value">Purchase Value (₦)</Label>
                                    <Input
                                        id="purchase_value"
                                        type="number"
                                        step="0.01"
                                        value={formData.purchase_value}
                                        onChange={(e) => handleChange('purchase_value', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="warranty_expiry">Warranty Expiry Date</Label>
                                <Input
                                    id="warranty_expiry"
                                    type="date"
                                    value={formData.warranty_expiry}
                                    onChange={(e) => handleChange('warranty_expiry', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Register Device
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div >
    );
}
