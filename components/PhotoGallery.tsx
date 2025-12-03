'use client';

import { useState } from 'react';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { AlbumAsset } from '@/lib/supabase';

interface PhotoGalleryProps {
  assets: AlbumAsset[];
}

export default function PhotoGallery({ assets }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  
  // Filter only photos for display
  const photos = assets.filter(asset => asset.type === 'photo');
  
  // Prepare slides for lightbox
  const slides = photos.map(photo => ({
    src: photo.uri,
    alt: photo.title,
  }));

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow"
            onClick={() => setLightboxIndex(index)}
          >
            <Image
              src={photo.uri}
              alt={photo.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-sm font-medium truncate">
                  {photo.title}
                </p>
                <p className="text-white/80 text-xs">
                  {new Date(photo.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
      />
    </>
  );
}
