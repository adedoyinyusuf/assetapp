'use client'

import { useState, useEffect } from 'react'
import AssetForm from '@/components/AssetForm'
import { getCategories, getStates, getLGAs } from '@/app/client-actions'
import type { Category, State, LGA } from '@/app/client-actions'

export default function AddAssetPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [states, setStates] = useState<State[]>([])
  const [initialLgas, setInitialLgas] = useState<LGA[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data for Add Asset page...');
        const [categoriesData, statesData] = await Promise.all([
          getCategories(),
          getStates()
        ]);
        
        console.log('Fetched categories:', categoriesData.length);
        console.log('Fetched states:', statesData.length);
        
        setCategories(categoriesData);
        setStates(statesData);
        
        // Get initial LGAs for first state if states exist
        if (statesData.length > 0) {
          const lgasData = await getLGAs(statesData[0].id);
          console.log('Fetched initial LGAs:', lgasData.length);
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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Add New Asset</h1>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Refresh function to re-fetch data after initialization
  const refreshData = async () => {
    console.log('Refreshing data after initialization...');
    setLoading(true);
    try {
      const [categoriesData, statesData] = await Promise.all([
        getCategories(),
        getStates()
      ]);
      
      console.log('Refreshed - categories:', categoriesData.length);
      console.log('Refreshed - states:', statesData.length);
      
      setCategories(categoriesData);
      setStates(statesData);
      
      // Get initial LGAs for first state if states exist
      if (statesData.length > 0) {
        const lgasData = await getLGAs(statesData[0].id);
        console.log('Refreshed - initial LGAs:', lgasData.length);
        setInitialLgas(lgasData);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Add New Asset</h1>
      <AssetForm 
        categories={categories} 
        states={states} 
        initialLgas={initialLgas}
        onDataRefresh={refreshData}
      />
    </div>
  )
}

