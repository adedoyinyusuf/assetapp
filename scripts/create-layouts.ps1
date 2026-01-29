$routes = @(
    'reports',
    'operations',
    'procurement',
    'disposal',
    'maintenance',
    'mdm',
    'locations',
    'profile',
    'categories',
    'depreciation'
)

$layoutContent = @'
import { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
'@

foreach ($route in $routes) {
    $layoutPath = "c:\Apps\assetapp\app\$route\layout.tsx"
    if (-not (Test-Path $layoutPath)) {
        $layoutContent | Set-Content $layoutPath
        Write-Host "✅ Created layout for /$route"
    }
    else {
        Write-Host "⏭️  Layout already exists for /$route"
    }
}

Write-Host "`n✨ Done! Created layouts for all main routes."
