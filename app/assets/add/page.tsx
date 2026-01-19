'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AssetForm from '@/components/AssetForm'
import { getCategories, getStates, getLGAs } from '@/app/client-actions'
import type { Category, State, LGA } from '@/app/client-actions'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function AddAssetPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [states, setStates] = useState<State[]>([])
  const [initialLgas, setInitialLgas] = useState<LGA[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, statesData] = await Promise.all([
          getCategories(),
          getStates()
        ]);

        setCategories(categoriesData);
        setStates(statesData);

        // Get initial LGAs for first state if states exist
        if (statesData.length > 0) {
          const lgasData = await getLGAs(statesData[0].id);
          setInitialLgas(lgasData);
        }
      } catch (error) {
        console.error('Error fetching data for Add Asset page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container py-10 max-w-4xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading form configurations...</p>
        </div>
      </div>
    );
  }

  // Refresh function to re-fetch data after initialization
  const refreshData = async () => {
    setLoading(true);
    try {
      const [categoriesData, statesData] = await Promise.all([
        getCategories(),
        getStates()
      ]);

      setCategories(categoriesData);
      setStates(statesData);

      if (statesData.length > 0) {
        const lgasData = await getLGAs(statesData[0].id);
        setInitialLgas(lgasData);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb / Back Navigation */}
      <div>
        <Link
          href="/assets"
          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Asset Management
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Register New Asset</h1>
        <p className="text-muted-foreground text-lg">
          Enter the details of the new asset to add it to the inventory.
        </p>
      </div>

      <AssetForm
        categories={categories}
        states={states}
        initialLgas={initialLgas}
        onDataRefresh={refreshData}
      />
    </div>
  )
}
