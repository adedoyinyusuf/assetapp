'use client';

import Image from 'next/image';

interface SignInAnimationProps {
  currentScene: number;
}

const banners = [
  {
    src: '/images/assets/vehicles/fleet.jpg',
    alt: 'Transport Fleet',
    title: 'Transport Fleet',
    description: 'Manage your vehicle assets efficiently'
  },
  {
    src: '/images/assets/buildings/office.jpg',
    alt: 'Business Properties',
    title: 'Business Properties',
    description: 'Track your real estate investments'
  },
  {
    src: '/images/assets/equipment/tech.jpg',
    alt: 'Office Equipment',
    title: 'Office Equipment',
    description: 'Monitor your technical assets'
  },
  {
    src: '/images/assets/furniture/interior.jpg',
    alt: 'Office Interior',
    title: 'Office Interior',
    description: 'Organize your furniture inventory'
  }
];

export function SignInAnimation({ currentScene }: SignInAnimationProps) {
  return (
    <div className="relative w-full h-full">
      {banners.map((banner, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentScene ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="relative w-full h-full">
            <Image
              src={banner.src}
              alt={banner.alt}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center space-y-4 px-4 sm:px-8">
                <h2 className="text-3xl font-bold text-white sm:text-4xl">
                  {banner.title}
                </h2>
                <p className="text-lg text-gray-200">
                  {banner.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
