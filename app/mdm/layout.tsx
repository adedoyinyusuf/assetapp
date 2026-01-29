import { ReactNode } from 'react';


export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="flex-1 py-6 md:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
