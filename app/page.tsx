'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faList } from '@fortawesome/free-solid-svg-icons/faList'
import './globals.css';

const banners = [
  { src: '/src/banner1.jpg', alt: 'Office equipment', text: 'Manage Your Office Equipment' },
  { src: '/src/banner2.jpg', alt: 'Company vehicles', text: 'Track Your Fleet' },
  { src: '/src/banner3.jpg', alt: 'IT assets', text: 'Monitor Your IT Assets' },
  { src: '/src/banner4.jpg', alt: 'Fixed Assets', text: 'Keep Tab of Your Office Buildings' },
  { src: '/src/banner5.png', alt: 'Intellectual Properties', text: 'Keep Records of Your Map Resources' },
]

export default function Home() {
  const [currentBanner, setCurrentBanner] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-gray-50">
      <div className="flex-grow flex items-center justify-center">
        <div className="relative w-full max-w-7xl h-[calc(100vh-3.5rem)] overflow-hidden rounded-xl shadow-xl">
          {banners.map((banner, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentBanner ? 'opacity-100' : 'opacity-0'}`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={banner.src || "/placeholder.svg"}
                  alt={banner.alt}
                  fill
                  priority={index === 0}
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center space-y-6 px-4 sm:px-8">
                  <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl lg:text-7xl">
                    {banner.text}
                  </h1>
                  <div>
                    <Link href="/assets">
                      <Button size="lg" variant="secondary">
                        <span className="font-semibold inline-flex items-center">
                          <FontAwesomeIcon icon={faList} className="mr-2" />
                          View Assets
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

