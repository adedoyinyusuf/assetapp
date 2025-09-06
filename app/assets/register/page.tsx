'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { addAsset, getCategories, getStates, getLGAs, Category, State, LGA } from '@/app/actions'
import Link from 'next/link'

export default function AssetRegisterPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [states, setStates] = useState<State[]>([])
  const [lgas, setLgas] = useState<LGA[]>([])
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const router = useRouter()

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    name: '',
    description: '',
    assetTag: '',
    serialNumber: '',
    
    // Step 2: Financial Information
    purchaseValue: '',
    purchaseDate: '',
    usefulLife: '',
    salvageValue: '',
    supplier: '',
    invoiceNumber: '',
    
    // Step 3: Classification & Location
    category_id: '',
    state_id: '',
    lga_id: '',
    specificLocation: '',
    
    // Step 4: Additional Details
    condition: 'Good',
    warranty: '',
    warrantyExpiry: '',
    notes: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, statesData] = await Promise.all([
          getCategories(),
          getStates()
        ])
        setCategories(categoriesData)
        setStates(statesData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (formData.state_id) {
      getLGAs(parseInt(formData.state_id)).then(setLgas)
    }
  }, [formData.state_id])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.name && formData.assetTag
      case 2:
        return formData.purchaseValue && formData.purchaseDate && formData.usefulLife
      case 3:
        return formData.category_id && formData.state_id && formData.lga_id
      case 4:
        return true // Optional step
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    } else {
      alert('Please fill in all required fields before proceeding.')
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      alert('Please complete all required fields.')
      return
    }

    setLoading(true)
    try {
      // Prepare asset data for submission

      const assetData = {
        name: formData.name,
        purchaseValue: parseFloat(formData.purchaseValue),
        purchaseDate: formData.purchaseDate,
        usefulLife: parseInt(formData.usefulLife),
        salvageValue: parseFloat(formData.salvageValue || '0'),
        categoryId: parseInt(formData.category_id),
        stateId: parseInt(formData.state_id),
        lgaId: parseInt(formData.lga_id)
      }

      await addAsset(assetData)
      alert('Asset registered successfully!')
      router.push('/assets/registry')
    } catch (error) {
      console.error('Error registering asset:', error)
      alert('Error registering asset. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter asset name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="assetTag">Asset Tag *</Label>
                <Input
                  id="assetTag"
                  value={formData.assetTag}
                  onChange={(e) => handleInputChange('assetTag', e.target.value)}
                  placeholder="e.g., NPC-001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  placeholder="Enter serial number"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the asset"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseValue">Purchase Value ($) *</Label>
                <Input
                  id="purchaseValue"
                  type="number"
                  value={formData.purchaseValue}
                  onChange={(e) => handleInputChange('purchaseValue', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="usefulLife">Useful Life (years) *</Label>
                <Input
                  id="usefulLife"
                  type="number"
                  value={formData.usefulLife}
                  onChange={(e) => handleInputChange('usefulLife', e.target.value)}
                  placeholder="5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="salvageValue">Salvage Value ($)</Label>
                <Input
                  id="salvageValue"
                  type="number"
                  value={formData.salvageValue}
                  onChange={(e) => handleInputChange('salvageValue', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange('supplier', e.target.value)}
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  placeholder="Invoice reference"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Classification & Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state_id} onValueChange={(value) => handleInputChange('state_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.id.toString()}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lga">LGA *</Label>
                <Select value={formData.lga_id} onValueChange={(value) => handleInputChange('lga_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select LGA" />
                  </SelectTrigger>
                  <SelectContent>
                    {lgas.map((lga) => (
                      <SelectItem key={lga.id} value={lga.id.toString()}>
                        {lga.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="specificLocation">Specific Location</Label>
                <Input
                  id="specificLocation"
                  value={formData.specificLocation}
                  onChange={(e) => handleInputChange('specificLocation', e.target.value)}
                  placeholder="Building, floor, room"
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Excellent">Excellent</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="warranty">Warranty Period</Label>
                <Input
                  id="warranty"
                  value={formData.warranty}
                  onChange={(e) => handleInputChange('warranty', e.target.value)}
                  placeholder="e.g., 2 years"
                />
              </div>
              <div>
                <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  value={formData.warrantyExpiry}
                  onChange={(e) => handleInputChange('warrantyExpiry', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional information"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Register New Asset</h1>
        <Link href="/assets/registry">
          <Button variant="outline">
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Registry
          </Button>
        </Link>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep 
                    ? 'bg-green-600 text-white' 
                    : step < currentStep 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Basic Info</span>
            <span>Financial</span>
            <span>Location</span>
            <span>Details</span>
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>Step {currentStep} of 4</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep} 
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        <div className="flex gap-2">
          {currentStep < 4 ? (
            <Button onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              {loading ? 'Registering...' : 'Register Asset'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
