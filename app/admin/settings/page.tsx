'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Save, Database, Bell, Shield, Globe } from 'lucide-react'

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    // General Settings
    systemName: 'NPC Asset Management System',
    systemDescription: 'National Population Commission Asset Management and Tracking System',
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY',
    currency: 'NGN',

    // Database Settings
    backupFrequency: 'daily',
    retentionPeriod: '365',

    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    systemAlerts: true,

    // Security Settings
    sessionTimeout: '30',
    passwordMinLength: '8',
    requireTwoFactor: false,

    // Asset Settings
    defaultDepreciationMethod: 'straight-line',
    defaultUsefulLife: '5',
    autoGenerateAssetTags: true,
    assetTagPrefix: 'NPC-'
  })

  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      alert('Settings saved successfully!')
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">System Settings</h1>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="systemName">System Name</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => handleInputChange('systemName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Africa/Cairo">Africa/Cairo (EET)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select value={settings.dateFormat} onValueChange={(value) => handleInputChange('dateFormat', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="systemDescription">System Description</Label>
              <Textarea
                id="systemDescription"
                value={settings.systemDescription}
                onChange={(e) => handleInputChange('systemDescription', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Database Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Select value={settings.backupFrequency} onValueChange={(value) => handleInputChange('backupFrequency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="retentionPeriod">Data Retention Period (days)</Label>
              <Input
                id="retentionPeriod"
                type="number"
                value={settings.retentionPeriod}
                onChange={(e) => handleInputChange('retentionPeriod', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600">Send email alerts for system events</p>
              </div>
              <Button
                variant={settings.emailNotifications ? "default" : "outline"}
                onClick={() => handleInputChange('emailNotifications', !settings.emailNotifications)}
              >
                {settings.emailNotifications ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-gray-600">Send SMS alerts for critical events</p>
              </div>
              <Button
                variant={settings.smsNotifications ? "default" : "outline"}
                onClick={() => handleInputChange('smsNotifications', !settings.smsNotifications)}
              >
                {settings.smsNotifications ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>System Alerts</Label>
                <p className="text-sm text-gray-600">Show in-app notifications</p>
              </div>
              <Button
                variant={settings.systemAlerts ? "default" : "outline"}
                onClick={() => handleInputChange('systemAlerts', !settings.systemAlerts)}
              >
                {settings.systemAlerts ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => handleInputChange('passwordMinLength', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Require 2FA for all users</p>
                </div>
                <Button
                  variant={settings.requireTwoFactor ? "default" : "outline"}
                  onClick={() => handleInputChange('requireTwoFactor', !settings.requireTwoFactor)}
                >
                  {settings.requireTwoFactor ? 'Required' : 'Optional'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5" />
            Asset Management Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="depreciationMethod">Default Depreciation Method</Label>
              <Select value={settings.defaultDepreciationMethod} onValueChange={(value) => handleInputChange('defaultDepreciationMethod', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight-line">Straight Line</SelectItem>
                  <SelectItem value="declining-balance">Declining Balance</SelectItem>
                  <SelectItem value="sum-of-years">Sum of Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="defaultUsefulLife">Default Useful Life (years)</Label>
              <Input
                id="defaultUsefulLife"
                type="number"
                value={settings.defaultUsefulLife}
                onChange={(e) => handleInputChange('defaultUsefulLife', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="assetTagPrefix">Asset Tag Prefix</Label>
              <Input
                id="assetTagPrefix"
                value={settings.assetTagPrefix}
                onChange={(e) => handleInputChange('assetTagPrefix', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Generate Asset Tags</Label>
                <p className="text-sm text-gray-600">Automatically create unique asset tags</p>
              </div>
              <Button
                variant={settings.autoGenerateAssetTags ? "default" : "outline"}
                onClick={() => handleInputChange('autoGenerateAssetTags', !settings.autoGenerateAssetTags)}
              >
                {settings.autoGenerateAssetTags ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={loading} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  )
}
