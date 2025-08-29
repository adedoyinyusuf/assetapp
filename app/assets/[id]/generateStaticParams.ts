import { getAssets } from '@/app/actions';

export async function generateStaticParams() {
  const assets = await getAssets();
  return assets.map(asset => ({
    id: asset.id.toString(),
  }));
}