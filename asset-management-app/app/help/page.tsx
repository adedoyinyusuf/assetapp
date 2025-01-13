import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Help Center</h1>
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I add a new asset?</AccordionTrigger>
              <AccordionContent>
                To add a new asset, navigate to the "Asset" menu and select "Add Asset". Fill in the required information in the form and click "Add Asset" to save.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How is depreciation calculated?</AccordionTrigger>
              <AccordionContent>
                Depreciation is calculated using the straight-line method. The annual depreciation is determined by subtracting the salvage value from the purchase value and dividing by the useful life of the asset.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can I track asset movements?</AccordionTrigger>
              <AccordionContent>
                Yes, you can track asset movements. Go to the "Track Asset" menu and select "Asset Movement". Here you can view the movement history of all assets and record new movements.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}

