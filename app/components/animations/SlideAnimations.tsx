'use client';

import { useState, useEffect } from 'react';
import styles from './SlideAnimations.module.css';
import Image from 'next/image';

interface AnimationProps {
  scene: number;
  isActive: boolean;
}

const categoryData = {
  1: {
    title: 'Transport Fleet',
    description: 'Manage your vehicle assets efficiently',
    image: '/images/assets/vehicles/fleet.jpg'
  },
  2: {
    title: 'Business Properties',
    description: 'Track your real estate investments',
    image: '/images/assets/buildings/office.jpg'
  },
  3: {
    title: 'Office Equipment',
    description: 'Monitor your technical assets',
    image: '/images/assets/equipment/tech.jpg'
  },
  4: {
    title: 'Office Interior',
    description: 'Organize your furniture inventory',
    image: '/images/assets/furniture/interior.jpg'
  }
} as const;

export const AssetCategoryAnimation = ({ scene, isActive }: AnimationProps) => {
  const [mounted, setMounted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      setTransitioning(false);
    } else {
      const timer = setTimeout(() => {
        setTransitioning(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!mounted) return null;

  const category = categoryData[scene as keyof typeof categoryData];
  const shouldRender = isActive || !transitioning;

  if (!shouldRender) return null;

  return (
    <div 
      className={`${styles.slideContainer} ${isActive ? styles.active : styles.inactive}`}
      style={{ zIndex: isActive ? 2 : 1 }}
    >
      <div className={styles.imageWrapper}>
        <Image
          src={category.image}
          alt={category.title}
          className={styles.categoryImage}
          fill
          priority
          sizes="50vw"
          quality={90}
          style={{ objectFit: 'cover' }}
        />
        <div className={styles.imageOverlay} />
        <div className={styles.categoryInfo}>
          <h2 className={styles.categoryTitle}>{category.title}</h2>
          <p className={styles.categoryDescription}>{category.description}</p>
        </div>
      </div>
    </div>
  );
};


