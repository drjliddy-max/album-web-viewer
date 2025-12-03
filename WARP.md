# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Next.js 14** web viewer for Baby Milestone shared albums, deployed to Vercel at `babymilestone.app`. It provides public, token-based access to photo albums without requiring user login.

## Development Commands

### Setup
```bash
npm install
cp .env.example .env.local  # Then configure with Supabase credentials
```

### Development
```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm start        # Start production server locally
npm run lint     # Run ESLint
```

### Testing Album Access
Visit `http://localhost:3000/album/{TOKEN}` where `{TOKEN}` is a valid share token from the database (e.g., `TBX7L9EZ`).

### Deployment
```bash
vercel                        # Deploy preview
vercel --prod                 # Deploy to production
vercel env add ENV_VAR_NAME   # Add environment variable
```

## Architecture

### Routing Structure
- **Next.js App Router** (not Pages Router)
- Dynamic route: `app/album/[token]/page.tsx` handles all album views
- Server-side rendering with `dynamic = 'force-dynamic'` and `revalidate = 0` for fresh data

### Data Flow
1. URL contains share token: `/album/{TOKEN}`
2. `getAlbumByToken()` fetches album from Supabase, validates `is_active` and `expires_at`
3. Parallel fetch: `getBabyProfile()` + `getAlbumAssets()` for photos/PDFs
4. `incrementViewCount()` fires asynchronously (non-blocking)
5. SSR renders album with PhotoGallery component

### Key Files
- `lib/supabase.ts` - All Supabase queries, shared interfaces
- `app/album/[token]/page.tsx` - Main album page (SSR)
- `components/PhotoGallery.tsx` - Client-side photo grid + lightbox
- `next.config.js` - Image optimization config for Supabase Storage URLs

### Database Dependencies
**Supabase Tables:**
- `shared_albums` - Album metadata, share tokens, expiration
- `babies` - Baby profiles (name, birth_date)
- `photos` - Photo assets with `storage_url` or `uri`
- `pdfs` - PDF documents

**RPC Function:**
- `increment_album_view_count(album_id UUID)` - Atomic view counter

**Critical:** RLS policies must allow public SELECT on all four tables for unauthenticated users.

### Asset Handling
- Photos and PDFs are stored in `asset_ids` as JSON stringified array in `shared_albums`
- `getAlbumAssets()` queries both `photos` and `pdfs` tables, merges results, sorts by timestamp descending
- Images are served via Next.js Image component with Supabase CDN (`**.supabase.co`)

### Environment Variables
Required in `.env.local` and Vercel:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Development Patterns

### Making Schema Changes
If Supabase schema changes (e.g., new columns on `shared_albums`):
1. Update TypeScript interfaces in `lib/supabase.ts`
2. Update query selects if needed
3. Test locally with real tokens before deploying

### Adding New Asset Types
To support new asset types beyond photos/PDFs:
1. Add table query to `getAlbumAssets()`
2. Update `AlbumAsset` type in `lib/supabase.ts`
3. Update `PhotoGallery.tsx` to handle new type rendering

### Error Handling
- Invalid/expired tokens trigger Next.js `notFound()` → shows `app/album/[token]/not-found.tsx`
- All Supabase errors are logged to console but handled gracefully (return null/empty arrays)

## Deployment Notes

- **Hosting**: Vercel (configured in `vercel.json`)
- **Custom domain**: `babymilestone.app` (DNS configured via CNAME to Vercel)
- **Image optimization**: Automatic via Next.js with WebP/AVIF formats
- **Security headers**: Configured in `vercel.json` (X-Frame-Options, CSP, etc.)
- Auto-deploys on git push when connected to GitHub

## Common Issues

### Images not loading
1. Check Supabase Storage bucket is public
2. Verify `storage_url` or `uri` in database contains full URL
3. Add `babymilestone.app` to Supabase Storage CORS settings

### Album not found with valid token
1. Verify `is_active = true` in database
2. Check `expires_at` is null or future date
3. Confirm RLS policies allow public read access

### Build failures on Vercel
- Ensure environment variables are set in Vercel dashboard
- Check build logs for TypeScript/ESLint errors
- Use `vercel --prod --force` to clear cache and rebuild
