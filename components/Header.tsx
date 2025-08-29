'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/src/logo.png" alt="Logo" width={32} height={32} />
            <span className="hidden font-bold sm:inline-block">
              Asset Management
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={`px-4 py-2 text-sm font-medium ${
                      pathname === '/' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/about" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={`px-4 py-2 text-sm font-medium ${
                      pathname === '/about' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    About
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {session && (
                <>
                  <NavigationMenuItem>
                    <Link href="/dashboard" legacyBehavior passHref>
                      <NavigationMenuLink
                        className={`px-4 py-2 text-sm font-medium ${
                          pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        Dashboard
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Assets</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              href="/assets/manage"
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="text-sm font-medium leading-none">Manage Assets</div>
                              <p className="text-sm leading-snug text-muted-foreground">
                                View and manage all assets
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              href="/assets/add"
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="text-sm font-medium leading-none">Add Asset</div>
                              <p className="text-sm leading-snug text-muted-foreground">
                                Register new assets
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center space-x-2">
            {!session ? (
              <Link href="/auth/signin" passHref>
                <Button variant="outline">Sign In</Button>
              </Link>
            ) : (
              <Link href="/api/auth/signout" passHref>
                <Button variant="outline">Sign Out</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
