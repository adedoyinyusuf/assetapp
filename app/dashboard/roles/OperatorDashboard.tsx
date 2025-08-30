import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, ClipboardList, CheckCircle, AlertCircle } from 'lucide-react';

export default function OperatorDashboard({ assets }: { assets: any[] }) {
  // Calculate assigned assets count from the actual assets array
  const assignedAssetsCount = assets.length > 0 ? Math.min(24, assets.length) : 0;

  const stats = [
    {
      title: 'Assigned Assets',
      value: assignedAssetsCount.toString(),
      icon: <ClipboardList className="h-6 w-6 text-blue-500" />,
      description: 'Under your responsibility',
    },
    {
      title: 'Tasks Due',
      value: '3',
      icon: <AlertCircle className="h-6 w-6 text-yellow-500" />,
      description: 'Require attention',
    },
    {
      title: 'Completed',
      value: '12',
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      description: 'Tasks this week',
    },
    {
      title: 'Maintenance',
      value: '5',
      icon: <Wrench className="h-6 w-6 text-purple-500" />,
      description: 'Scheduled this week',
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
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  View Tasks
                </Button>
                <Button variant="outline" className="justify-start">
                  <Wrench className="mr-2 h-4 w-4" />
                  Report Issue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <div>
                  <p className="text-sm font-medium">Task completed: Asset #1234</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                <div>
                  <p className="text-sm font-medium">New task assigned</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
