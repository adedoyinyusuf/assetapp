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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBuilding, faBars, faTimes } from '@fortawesome/free-solid-svg-icons'

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
          <nav className="bg-gradient-to-r from-green-700 to-green-800 text-white shadow-lg">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center h-16">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
                  <div className="bg-white p-2 rounded-lg">
                    <FontAwesomeIcon icon={faBuilding} className="h-6 w-6 text-green-700" />
                  </div>
                  <div>
                    <span className="text-xl font-bold">NPC Assets</span>
                    <p className="text-xs text-green-200 hidden sm:block">Management System</p>
                  </div>
                </Link>
                
                {/* Desktop Navigation */}
                <NavigationMenu className="hidden lg:block">
                  <NavigationMenuList className="flex items-center gap-2">
                    {/* Navigation Items */}
                    <NavigationMenuItem>
                      <Link href="/" legacyBehavior passHref>
                        <NavigationMenuLink className="px-4 py-2 rounded-lg text-white hover:bg-green-600 transition-colors">
                          Home
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                    

                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="px-4 py-2 rounded-lg text-white hover:bg-green-600 transition-colors bg-transparent">
                        Assets
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[450px] gap-2 p-6 bg-white shadow-xl border border-gray-200 rounded-xl">
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/assets/registry" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Asset Registry</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Complete asset database with search and filters
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/assets/register" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Register New Asset</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Add new assets with complete workflow
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/assets/search" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Asset Search</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Advanced search and filtering tools
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/assets/reports" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Asset Reports</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Detailed asset reporting and analytics
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="px-4 py-2 rounded-lg text-white hover:bg-green-600 transition-colors bg-transparent">
                        Operations
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[450px] gap-2 p-6 bg-white shadow-xl border border-gray-200 rounded-xl">
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/operations/movements" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Asset Movements</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Track and manage asset relocations
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/operations/maintenance" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Maintenance Records</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Track maintenance and service history
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/operations/disposal" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Asset Disposal</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Manage asset retirement and disposal
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/operations/depreciation" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Depreciation Tracking</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Monitor asset depreciation and valuation
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="px-4 py-2 rounded-lg text-white hover:bg-green-600 transition-colors bg-transparent">
                        Administration
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[450px] gap-2 p-6 bg-white shadow-xl border border-gray-200 rounded-xl">
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/admin/categories" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Categories Management</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Manage asset categories and classifications
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/admin/locations" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">Locations Management</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Manage states, LGAs and office locations
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/admin/users" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">User Management</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Manage users, roles and permissions
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <Link href="/admin/settings" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-green-100 hover:text-green-800 focus:bg-green-100 focus:text-green-800">
                                <div className="text-sm font-medium leading-none">System Settings</div>
                                <p className="line-clamp-2 text-sm leading-snug text-gray-500">
                                  Configure system preferences and settings
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <Link href="/reports" legacyBehavior passHref>
                        <NavigationMenuLink className="px-4 py-2 rounded-lg text-white hover:bg-green-600 transition-colors">
                          Reports
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <Link href="/help" legacyBehavior passHref>
                        <NavigationMenuLink className="px-4 py-2 rounded-lg text-white hover:bg-green-600 transition-colors">
                          Help & Support
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>

                {/* Mobile Menu Button */}
                <button className="lg:hidden text-white p-2">
                  <FontAwesomeIcon icon={faBars} className="h-6 w-6" />
                </button>
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
