import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AssetsIndexPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Management</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Select an option below:</p>
        <ul className="list-disc ml-6 mt-2">
          <li><Link href="/assets/manage">Manage Assets</Link></li>
          <li><Link href="/assets/add">Add Asset</Link></li>
        </ul>
      </CardContent>
    </Card>
  );
}
