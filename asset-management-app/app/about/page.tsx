import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">About Asset Management Solution</h1>
      <Card>
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            The Asset Management Solution is designed to help businesses efficiently track, manage, and optimize their assets. 
            Our goal is to provide a comprehensive tool that simplifies asset tracking, depreciation calculations, and movement history, 
            allowing organizations to make informed decisions about their resources.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Comprehensive asset tracking and management</li>
            <li>Automated depreciation calculations</li>
            <li>Asset movement history</li>
            <li>Customizable categories for better organization</li>
            <li>Intuitive dashboard for quick insights</li>
            <li>Detailed reporting capabilities</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

