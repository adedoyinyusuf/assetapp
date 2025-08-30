import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Search, FileText, BarChart2 } from 'lucide-react';

export default function ViewerDashboard({ assets }: { assets: any[] }) {
  const stats = [
    {
      title: 'Total Assets',
      value: assets.length,
      icon: <FileText className="h-6 w-6 text-blue-500" />,
      description: 'In the system',
    },
    {
      title: 'Asset Categories',
      value: '5',
      icon: <BarChart2 className="h-6 w-6 text-green-500" />,
      description: 'Different types',
    },
    {
      title: 'Locations',
      value: '12',
      icon: <Search className="h-6 w-6 text-yellow-500" />,
      description: 'Different locations',
    },
    {
      title: 'Your Access',
      value: 'View Only',
      icon: <Eye className="h-6 w-6 text-purple-500" />,
      description: 'Read access',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              As a viewer, you have read-only access to the following:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-blue-500" />
                View asset details
              </li>
              <li className="flex items-center">
                <Search className="h-4 w-4 mr-2 text-green-500" />
                Search and filter assets
              </li>
              <li className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-2 text-purple-500" />
                View reports and analytics
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                <div>
                  <p className="text-sm font-medium">New assets added</p>
                  <p className="text-xs text-muted-foreground">5 new assets added this week</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <div>
                  <p className="text-sm font-medium">System update</p>
                  <p className="text-xs text-muted-foreground">New reporting features added</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
