import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Search, CheckCircle, Clock } from 'lucide-react';

export default function AuditorDashboard({ assets }: { assets: any[] }) {
  const stats = [
    {
      title: 'Total Assets',
      value: assets.length,
      icon: <FileText className="h-6 w-6 text-blue-500" />,
      description: 'In the system',
    },
    {
      title: 'Audit Items',
      value: '12',
      icon: <Search className="h-6 w-6 text-yellow-500" />,
      description: 'Require attention',
    },
    {
      title: 'Compliance',
      value: '92%',
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      description: 'Compliance rate',
    },
    {
      title: 'Pending Audits',
      value: '3',
      icon: <Clock className="h-6 w-6 text-purple-500" />,
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
            <CardTitle>Audit Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  <FileText className="mr-2 h-4 w-4" />
                  Start New Audit
                </button>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  <Search className="mr-2 h-4 w-4" />
                  View Audit Logs
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Audit Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <div>
                  <p className="text-sm font-medium">Audit completed: Q3 2023</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>
                <div>
                  <p className="text-sm font-medium">3 compliance issues found</p>
                  <p className="text-xs text-muted-foreground">1 week ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
