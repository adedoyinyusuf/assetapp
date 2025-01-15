import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Asset Management Solution',
  description: 'Manage your assets efficiently',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <div className="bg-white py-2 border-b">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 text-center md:text-left">
              <Image src="/src/logo.png" alt="Asset Manager Logo" width={40} height={40} />
              <h1 className="text-2xl font-bold text-green-700">National Population Commission</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="bg-green-700 text-white">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                  <span className="text-xl font-bold">Welcome to the Asset Management Platform</span>
                </Link>
                <NavigationMenu>
                  <NavigationMenuList className="flex items-center gap-6">
                    {/* Navigation Items */}
                    <NavigationMenuItem>
                      <Link href="/" legacyBehavior passHref>
                        <NavigationMenuLink className="text-white hover:text-green-300">
                          Home
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="text-white hover:text-green-300 bg-transparent">
                        Asset
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 bg-white border border-green-700 rounded-md">
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/assets/manage" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Manage Assets</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  View and manage all assets
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/assets/add" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Add Asset</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Add a new asset to the system
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <Link href="/asset-movement" legacyBehavior passHref>
                              <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Asset Movement</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Track asset movements
                                </p>
                              </NavigationMenuLink>
                            </Link>
                          </li>
                          <li>
                            <Link href="/depreciation" legacyBehavior passHref>
                              <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Track Depreciation</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Monitor asset depreciation
                                </p>
                              </NavigationMenuLink>
                            </Link>
                          </li>
                          <li>
                            <Link href="/categories" legacyBehavior passHref>
                              <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Categories</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Manage asset categories
                                </p>
                              </NavigationMenuLink>
                            </Link>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <Link href="/dashboard" legacyBehavior passHref>
                        <NavigationMenuLink className="text-white hover:text-green-300">
                          Dashboard
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <Link href="/about" legacyBehavior passHref>
                        <NavigationMenuLink className="text-white hover:text-green-300">
                          About
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <Link href="/help" legacyBehavior passHref>
                        <NavigationMenuLink className="text-white hover:text-green-300">
                          Help
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto px-4">
              <div className="text-center">
                <p className="text-sm">&copy; {new Date().getFullYear()} Asset Management Solution. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}

