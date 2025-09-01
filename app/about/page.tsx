import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About National Population Commission</h1>
          <p className="text-xl text-muted-foreground">
            Efficiently managing assets for a better tomorrow
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To provide accurate, reliable, and timely demographic data for national development 
                while ensuring the efficient management of our assets and resources.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To be a world-class organization in population data management and 
                asset resource optimization, serving as a model for other government agencies.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Asset Management System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Our Asset Management System provides a comprehensive solution for tracking, 
                maintaining, and optimizing the use of all assets under the National Population Commission.
              </p>
              <p className="text-muted-foreground">
                Key features include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Complete asset inventory tracking</li>
                <li>Depreciation and maintenance scheduling</li>
                <li>Asset movement and transfer history</li>
                <li>Comprehensive reporting and analytics</li>
                <li>Role-based access control</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Headquarters</h3>
                <p className="text-muted-foreground">
                  National Population Commission Headquarters<br />
                  Plot 2031, Olusegun Obasanjo Way, Zone 7, Wuse,<br />
                  PMB 2851, Garki, Abuja, Nigeria
                </p>
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-muted-foreground">
                  info@npopc.gov.ng
                </p>
              </div>
              <div>
                <h3 className="font-medium">Phone</h3>
                <p className="text-muted-foreground">
                  +234 9 234 5678
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button variant="link" className="p-0 h-auto justify-start" asChild>
                  <Link href="/help">Help & Documentation</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  Access user guides and documentation
                </p>
              </div>
              <div className="space-y-2">
                <Button variant="link" className="p-0 h-auto justify-start" asChild>
                  <Link href="/reports">View Reports</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  Access system reports and analytics
                </p>
              </div>
              <div className="space-y-2">
                <Button variant="link" className="p-0 h-auto justify-start" asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  Get help from our support team
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">Version</h3>
                <p className="text-muted-foreground">Asset Management System v2.0.0</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Last Updated</h3>
                <p className="text-muted-foreground">November 15, 2023</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
