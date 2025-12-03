import { notFound } from 'next/navigation';
import { getAlbumByToken, getAlbumAssets, getBabyProfile, incrementViewCount } from '@/lib/supabase';
import PhotoGallery from '@/components/PhotoGallery';

interface AlbumPageProps {
  params: {
    token: string;
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { token } = params;

  // Fetch album data
  const album = await getAlbumByToken(token);

  if (!album) {
    notFound();
  }

  // Fetch baby profile and assets in parallel
  const [baby, assets] = await Promise.all([
    getBabyProfile(album.baby_id),
    getAlbumAssets(album.asset_ids, album.baby_id),
  ]);

  // Increment view count (don't await to avoid blocking render)
  incrementViewCount(album.id).catch(console.error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{album.name}</h1>
              {baby && (
                <p className="text-lg text-gray-600 mt-1">
                  {baby.name}'s Memories
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{album.view_count} views</span>
            </div>
          </div>

          {album.description && (
            <p className="mt-3 text-gray-700">{album.description}</p>
          )}

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{assets.length} {assets.length === 1 ? 'item' : 'items'}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Created {new Date(album.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {assets.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              No photos yet
            </h2>
            <p className="text-gray-500">
              Photos will appear here once they're added to the album
            </p>
          </div>
        ) : (
          <PhotoGallery assets={assets} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 pb-8 text-center text-sm text-gray-500">
        <p>
          Powered by{' '}
          <span className="font-semibold text-primary">Baby Milestone</span>
        </p>
        <p className="mt-1">
          Beautiful memories, safely shared
        </p>
      </footer>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: AlbumPageProps) {
  const { token } = params;
  const album = await getAlbumByToken(token);

  if (!album) {
    return {
      title: 'Album Not Found',
    };
  }

  const baby = await getBabyProfile(album.baby_id);

  return {
    title: `${album.name} - ${baby?.name || 'Baby'}'s Album`,
    description: album.description || `View ${baby?.name || 'baby'}'s shared photo album`,
    openGraph: {
      title: album.name,
      description: album.description || `${baby?.name || 'Baby'}'s memories`,
      type: 'website',
    },
  };
}
