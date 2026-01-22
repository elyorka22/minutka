// ============================================
// Banner Component
// ============================================

import Image from 'next/image';
import Link from 'next/link';
import { Banner as BannerType } from '../../shared/types';

interface BannerProps {
  banner: BannerType;
}

export default function Banner({ banner }: BannerProps) {
  const content = (
    <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      {banner.image_url && (
        <div className="relative w-full h-48">
          <Image
            src={banner.image_url}
            alt={banner.title || 'Banner'}
            fill
            className="object-cover"
          />
          {banner.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-3">
              <p className="font-semibold">{banner.title}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (banner.link_url) {
    return (
      <Link href={banner.link_url} target="_blank" rel="noopener noreferrer">
        {content}
      </Link>
    );
  }

  return content;
}


