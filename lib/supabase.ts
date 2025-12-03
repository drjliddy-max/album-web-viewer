import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No auth needed for public album viewing
  },
});

export interface SharedAlbum {
  id: string;
  family_group_id: string;
  baby_id: string;
  created_by: string;
  name: string;
  description?: string;
  asset_ids: string[];
  share_token: string;
  view_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlbumAsset {
  id: string;
  uri: string;
  type: 'photo' | 'pdf';
  title: string;
  timestamp: number;
  baby_id: string;
}

/**
 * Fetch album data by share token
 */
export async function getAlbumByToken(token: string): Promise<SharedAlbum | null> {
  try {
    const { data, error } = await supabase
      .from('shared_albums')
      .select('*')
      .eq('share_token', token)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching album:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Check if expired
    if (data.expires_at) {
      const expiryDate = new Date(data.expires_at);
      if (expiryDate < new Date()) {
        return null;
      }
    }

    // Parse asset_ids JSON string
    return {
      ...data,
      asset_ids: typeof data.asset_ids === 'string' 
        ? JSON.parse(data.asset_ids) 
        : data.asset_ids,
    };
  } catch (error) {
    console.error('Error in getAlbumByToken:', error);
    return null;
  }
}

/**
 * Increment view count for an album
 */
export async function incrementViewCount(albumId: string): Promise<void> {
  try {
    await supabase.rpc('increment_album_view_count', { album_id: albumId });
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
}

/**
 * Get baby profile by ID
 */
export async function getBabyProfile(babyId: string) {
  try {
    const { data, error } = await supabase
      .from('babies')
      .select('id, name, date_of_birth')
      .eq('id', babyId)
      .single();

    if (error) {
      console.error('Error fetching baby profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getBabyProfile:', error);
    return null;
  }
}

/**
 * Get album assets (photos and PDFs)
 */
export async function getAlbumAssets(assetIds: string[], babyId: string): Promise<AlbumAsset[]> {
  try {
    const assets: AlbumAsset[] = [];

    // Fetch photos
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, uri, storage_url, title, timestamp, baby_id')
      .in('id', assetIds)
      .eq('baby_id', babyId);

    if (photosError) {
      console.error('Error fetching photos:', photosError);
    } else if (photos) {
      assets.push(...photos.map(p => ({
        id: p.id,
        uri: p.storage_url || p.uri,
        type: 'photo' as const,
        title: p.title || 'Photo',
        timestamp: typeof p.timestamp === 'number' ? p.timestamp : Date.now(),
        baby_id: p.baby_id,
      })));
    }

    // Fetch PDFs
    const { data: pdfs, error: pdfsError } = await supabase
      .from('pdfs')
      .select('id, storage_url, title, timestamp, baby_id')
      .in('id', assetIds)
      .eq('baby_id', babyId);

    if (pdfsError) {
      console.error('Error fetching PDFs:', pdfsError);
    } else if (pdfs) {
      assets.push(...pdfs.map(p => ({
        id: p.id,
        uri: p.storage_url,
        type: 'pdf' as const,
        title: p.title || 'Document',
        timestamp: typeof p.timestamp === 'number' ? p.timestamp : Date.now(),
        baby_id: p.baby_id,
      })));
    }

    // Sort by timestamp descending
    return assets.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error in getAlbumAssets:', error);
    return [];
  }
}
