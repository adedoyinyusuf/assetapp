'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Lock,
    Unlock,
    Trash2,
    MapPin,
    Bell,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RemoteControlPanelProps {
    deviceId: number;
    deviceName: string;
    isEnrolled: boolean;
    isLocked: boolean;
    onCommandExecuted?: () => void;
}

export default function RemoteControlPanel({
    deviceId,
    deviceName,
    isEnrolled,
    isLocked,
    onCommandExecuted
}: RemoteControlPanelProps) {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState<string | null>(null);

    const executeCommand = async (commandType: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/mdm/commands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_id: deviceId,
                    command_type: commandType,
                    initiated_by: 'admin' // TODO: Get from session
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Command failed');
            }

            alert(`${commandType} command sent successfully!`);
            if (onCommandExecuted) onCommandExecuted();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            setShowConfirm(null);
        }
    };

    if (!isEnrolled) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Remote Control</CardTitle>
                    <CardDescription>MDM commands for this device</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Device Not Enrolled</h3>
                        <p className="text-sm text-muted-foreground">
                            This device must be enrolled for MDM control before you can send remote commands.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Remote Control</CardTitle>
                    <CardDescription>Send commands to this device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Lock/Unlock */}
                    {isLocked ? (
                        <Button
                            onClick={() => setShowConfirm('UNLOCK')}
                            disabled={loading}
                            className="w-full"
                            variant="outline"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlock className="mr-2 h-4 w-4" />}
                            Unlock Device
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setShowConfirm('LOCK')}
                            disabled={loading}
                            className="w-full"
                            variant="destructive"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                            Lock Device
                        </Button>
                    )}

                    {/* Locate */}
                    <Button
                        onClick={() => setShowConfirm('LOCATE')}
                        disabled={loading}
                        className="w-full"
                        variant="outline"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                        Locate Device
                    </Button>

                    {/* Play Alarm */}
                    <Button
                        onClick={() => setShowConfirm('ALARM')}
                        disabled={loading}
                        className="w-full"
                        variant="outline"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                        Play Alarm Sound
                    </Button>

                    {/* Wipe Device */}
                    <Button
                        onClick={() => setShowConfirm('WIPE')}
                        disabled={loading}
                        className="w-full"
                        variant="destructive"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Wipe Device Data
                    </Button>

                    <div className="pt-4 border-t">
                        <Badge variant="outline" className="text-xs">
                            MDM Enrolled
                        </Badge>
                        {isLocked && (
                            <Badge variant="destructive" className="text-xs ml-2">
                                Device Locked
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialogs */}
            <AlertDialog open={showConfirm === 'LOCK'} onOpenChange={() => setShowConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Lock {deviceName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remotely lock the device. The user will need an unlock code to access it again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => executeCommand('LOCK')}>
                            Lock Device
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showConfirm === 'WIPE'} onOpenChange={() => setShowConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">⚠️ Wipe {deviceName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong className="text-red-600">THIS ACTION CANNOT BE UNDONE!</strong>
                            <br /><br />
                            This will permanently erase all data on the device, including:
                            <ul className="list-disc list-inside mt-2">
                                <li>Personal files and photos</li>
                                <li>Apps and app data</li>
                                <li>Settings and accounts</li>
                            </ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => executeCommand('WIPE')}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Confirm Wipe
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showConfirm === 'LOCATE'} onOpenChange={() => setShowConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Locate {deviceName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will request the current GPS location of the device.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => executeCommand('LOCATE')}>
                            Get Location
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showConfirm === 'ALARM'} onOpenChange={() => setShowConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Play Alarm on {deviceName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will play a loud alarm sound on the device, even if it's on silent mode.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => executeCommand('ALARM')}>
                            Play Alarm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showConfirm === 'UNLOCK'} onOpenChange={() => setShowConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unlock {deviceName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remotely unlock the device and allow the user to access it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => executeCommand('UNLOCK')}>
                            Unlock Device
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
