# ⚡ AppVault — Android App Download Site

Full-stack Next.js app store with admin panel, ad-gated downloads, and ad blocker detection.

## Project Structure
```
app/page.tsx              ← Client homepage (app grid + ads)
app/app/[id]/page.tsx     ← App detail + 30s ad-gate download  
app/admin/page.tsx        ← Admin panel (password protected)
app/api/apps/route.ts     ← GET all / POST new app
app/api/apps/[id]/route.ts ← GET / PUT / DELETE / PATCH
app/api/admin/route.ts    ← Login endpoint
lib/store.ts              ← JSON file-based data store
data/apps.json            ← App data (auto-created)
```

## Local Dev
```bash
cp .env.example .env.local   # then edit passwords
npm install
npm run dev
```
- Client: http://localhost:3000
- Admin:  http://localhost:3000/admin

## Deploy to Vercel
1. Push to GitHub
2. Import on vercel.com → New Project
3. Set env vars: ADMIN_PASSWORD, ADMIN_TOKEN
4. Deploy

> ⚠️ Vercel filesystem is ephemeral. For production use Vercel KV, Neon, or MongoDB Atlas.

## Real Ads Setup
Replace BannerAd placeholder divs with your AdSense/AdsTerra code.
In app/[id]/page.tsx handleDownloadClick, replace the placeholder URL with your ad network link.

## Ad Blocker Detection
Two-layer: bait element + script load check. Full-screen wall if blocked.

## App Upload Flow
1. Build APK → upload to Google Drive / Mediafire / MEGA
2. Get direct link → go to /admin → Publish → live instantly
