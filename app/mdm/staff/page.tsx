import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Phone, MapPin } from 'lucide-react';

async function getStaff() {
    try {
        const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/mdm/staff`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching staff:', error);
        return [];
    }
}

export default async function StaffPage() {
    const staff = await getStaff();

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Staff Management</h1>
                    <p className="text-muted-foreground mt-1">
                        {staff.length} staff member{staff.length !== 1 ? 's' : ''} registered
                    </p>
                </div>
                <Link
                    href="/mdm/staff/add"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                    <Users className="mr-2 h-4 w-4" />
                    Add Staff
                </Link>
            </div>

            {staff.length === 0 ? (
                <Card className="p-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No staff members</h3>
                    <p className="text-muted-foreground mb-4">
                        Add staff members to assign mobile devices
                    </p>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {staff.map((member: any) => (
                        <Card key={member.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{member.full_name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{member.position || 'Staff Member'}</p>
                                    </div>
                                    <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                        {member.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="text-sm">
                                    <span className="text-muted-foreground">ID:</span>{' '}
                                    <span className="font-mono">{member.staff_id}</span>
                                </div>

                                {member.department && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Department:</span>{' '}
                                        {member.department}
                                    </div>
                                )}

                                {member.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                        <span className="truncate">{member.email}</span>
                                    </div>
                                )}

                                {member.phone_number && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        <span>{member.phone_number}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
