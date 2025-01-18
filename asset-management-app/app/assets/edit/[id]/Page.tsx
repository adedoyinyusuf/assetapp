// app/assets/edit/[id]/page.tsx

import { getAssets } from '@/app/actions';
import AssetForm from '@/components/AssetForm';

// Define specific page props type for Next.js 13 App Router
type PageProps = {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function Page({ params }: PageProps) {
  // Extract id from params
  const { id } = params;
  
  // Fetch assets
  const assets = await getAssets();
  const asset = assets.find(a => a.id === parseInt(id));

  if (!asset) {
    return <div>Asset not found</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit Asset</h1>
      <AssetForm asset={asset} />
    </div>
  );
}