# Baby Milestone Album Web Viewer

Production-ready Next.js web application for viewing shared Baby Milestone albums. Deployed on Vercel at `babymilestone.app`.

## Features

- 🌐 **Public Album Viewing** - No login required for viewers
- 📸 **Responsive Photo Gallery** - Beautiful grid layout with lightbox
- 📱 **Mobile-First Design** - Optimized for all devices
- 🚀 **Fast Performance** - Next.js 14 with image optimization
- 🔒 **Secure** - Token-based access, expiration support
- 📊 **View Tracking** - Automatic view count increment
- 🎨 **Beautiful UI** - Tailwind CSS with custom design

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Hosting**: Vercel
- **Image Gallery**: yet-another-react-lightbox

## Prerequisites

Before deploying, ensure you have:

1. A Vercel account (free tier works)
2. Supabase project credentials
3. Node.js 18+ installed locally
4. Git repository (optional but recommended)

## Local Development Setup

### 1. Install Dependencies

```bash
cd album-web-viewer
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get these from**: Supabase Dashboard → Project Settings → API

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000/album/YOUR_TOKEN](http://localhost:3000/album/YOUR_TOKEN)

Replace `YOUR_TOKEN` with an actual album share token from your app.

### 4. Test with Real Data

1. Create an album in your React Native app
2. Copy the share token (e.g., `TBX7L9EZ`)
3. Visit: `http://localhost:3000/album/TBX7L9EZ`

## Vercel Deployment

### Method 1: Deploy via Vercel CLI (Recommended)

#### 1. Install Vercel CLI

```bash
npm install -g vercel
```

#### 2. Login to Vercel

```bash
vercel login
```

#### 3. Deploy

From the `album-web-viewer` directory:

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → baby-milestone-album-viewer
- **Directory?** → `./` (current directory)
- **Override settings?** → No

#### 4. Set Environment Variables

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Supabase anon key when prompted
```

Make sure to set these for all environments (Production, Preview, Development).

#### 5. Deploy to Production

```bash
vercel --prod
```

Your app will be deployed to: `https://baby-milestone-album-viewer.vercel.app`

### Method 2: Deploy via Vercel Dashboard

#### 1. Push Code to GitHub

```bash
cd album-web-viewer
git init
git add .
git commit -m "Initial commit: Album web viewer"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

#### 2. Import Project to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Select your GitHub repository
4. Click **"Import"**

#### 3. Configure Project

- **Framework Preset**: Next.js
- **Root Directory**: `album-web-viewer` (if monorepo)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

#### 4. Add Environment Variables

In the project settings:

1. Go to **Settings** → **Environment Variables**
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `your-supabase-url`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key`
3. Apply to all environments

#### 5. Deploy

Click **"Deploy"** - Vercel will build and deploy automatically.

## Custom Domain Setup (babymilestone.app)

### 1. Add Domain in Vercel

1. Go to Project Settings → **Domains**
2. Add domain: `babymilestone.app`
3. Vercel will provide DNS records

### 2. Configure DNS

In your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare):

**Option A: Using A Record**
```
Type: A
Name: @
Value: 76.76.21.21
```

**Option B: Using CNAME** (Recommended)
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

### 3. Add www Subdomain (Optional)

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4. Verify Domain

Vercel will automatically verify and issue SSL certificate (takes 5-30 minutes).

## Supabase Database Setup

The web viewer requires these Supabase tables:

### Required Tables

1. **shared_albums**
   - `id` (uuid, primary key)
   - `family_group_id` (uuid)
   - `baby_id` (uuid)
   - `created_by` (uuid)
   - `name` (text)
   - `description` (text, nullable)
   - `asset_ids` (text) - JSON stringified array
   - `share_token` (text, unique)
   - `view_count` (integer, default 0)
   - `expires_at` (timestamp, nullable)
   - `is_active` (boolean, default true)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

2. **babies**
   - `id` (uuid, primary key)
   - `name` (text)
   - `birth_date` (date)

3. **photos**
   - `id` (uuid, primary key)
   - `baby_id` (uuid)
   - `uri` (text)
   - `storage_url` (text, nullable)
   - `name` (text)
   - `title` (text, nullable)
   - `timestamp` (bigint)

4. **pdfs**
   - `id` (uuid, primary key)
   - `baby_id` (uuid)
   - `uri` (text)
   - `storage_url` (text, nullable)
   - `file_name` (text)
   - `uploaded_at` (bigint)

### Required RPC Function

Create this function in Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION increment_album_view_count(album_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE shared_albums
  SET view_count = view_count + 1
  WHERE id = album_id;
END;
$$ LANGUAGE plpgsql;
```

### Row Level Security (RLS)

Enable RLS and add policies for public album viewing:

```sql
-- Allow public read access to shared_albums
CREATE POLICY "Allow public read for active albums"
ON shared_albums FOR SELECT
USING (is_active = true);

-- Allow public read access to photos in shared albums
CREATE POLICY "Allow public read for album photos"
ON photos FOR SELECT
USING (true);

-- Allow public read access to PDFs in shared albums
CREATE POLICY "Allow public read for album pdfs"
ON pdfs FOR SELECT
USING (true);

-- Allow public read for baby profiles
CREATE POLICY "Allow public read for babies"
ON babies FOR SELECT
USING (true);
```

## Testing

### Test Album Access

1. Create album in React Native app
2. Get share token (e.g., `TBX7L9EZ`)
3. Visit: `https://babymilestone.app/album/TBX7L9EZ`

### Test Error Handling

- **Invalid token**: `https://babymilestone.app/album/INVALID`
  - Should show "Album Not Found" page
- **Expired album**: Create album with expiration, wait for expiry
  - Should show "Album Not Found" page

## Monitoring & Analytics

### View Counts

Album view counts are automatically tracked in the `shared_albums` table.

### Vercel Analytics

Enable in Vercel Dashboard:
1. Project Settings → **Analytics**
2. Enable Web Analytics (free)

### Error Tracking

Check Vercel Dashboard → **Functions** for error logs.

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Ensure environment variables are set in Vercel:
```bash
vercel env ls
```

Should show:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue: Images not loading

**Possible causes**:
1. **Supabase Storage**: Check if storage bucket is public
2. **Image URLs**: Verify `storage_url` or `uri` fields in database
3. **CORS**: Add your domain to Supabase Storage CORS settings

**Fix CORS in Supabase**:
1. Go to Storage → Configuration → CORS
2. Add: `https://babymilestone.app`

### Issue: "Album Not Found" for valid token

**Check**:
1. Album `is_active = true`
2. Album not expired (`expires_at` is null or in future)
3. Database RLS policies allow public read

### Issue: Build fails on Vercel

**Common fixes**:
```bash
# Clear cache and rebuild
vercel --prod --force

# Check build logs in Vercel dashboard
```

## Performance Optimization

### Image Optimization

Next.js automatically optimizes images. Configure in `next.config.js`:

```javascript
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200],
  imageSizes: [16, 32, 48, 64, 96],
}
```

### Caching

Supabase responses are cached by Next.js. Configure in page:

```typescript
export const revalidate = 3600; // Revalidate every hour
```

## Security

### Best Practices

✅ Environment variables are server-side only (prefixed with `NEXT_PUBLIC_` only for client)  
✅ Share tokens are cryptographically random  
✅ Albums can expire automatically  
✅ Row Level Security (RLS) enabled on Supabase  
✅ Security headers configured in `vercel.json`  

### Rate Limiting

Consider adding rate limiting for production:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

## Maintenance

### Update Dependencies

```bash
npm update
npm audit fix
```

### Redeploy

Auto-deploys on git push if connected to GitHub.

Manual redeploy:
```bash
vercel --prod
```

## Support

For issues:
1. Check Vercel build logs
2. Check Supabase logs
3. Review browser console for errors
4. Verify environment variables

## License

Private - Baby Milestone App
