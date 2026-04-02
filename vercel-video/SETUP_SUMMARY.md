# Video Background Setup - Summary

## What I Created

### Scripts (choose one)

| File | Type | Usage |
|------|------|-------|
| `download-background.sh` | Bash | `./download-background.sh` |
| `download-video.js` | Node.js | `node download-video.js` or `npm run video:download` |

Both scripts do the same thing:
1. Download YouTube video (muted)
2. Optimize to 1920px wide MP4
3. Create WebM fallback
4. Place in `/public` folder

### Components

| File | Purpose |
|------|---------|
| `components/VideoBackground.tsx` | Full-screen looping video with overlay |
| `pages/index.tsx` | Homepage with Batcave styling + video |

### Config

| File | Purpose |
|------|---------|
| `package.json` | Dependencies + npm scripts |
| `next.config.js` | Next.js config with video caching |
| `README.md` | Full documentation |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Download and optimize video
npm run video:download

# 3. Run dev server
npm run dev

# 4. Deploy
vercel --prod
```

## Custom YouTube URL

```bash
node download-video.js "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
```

## What You Get

A homepage that looks like this:

```
┌─────────────────────────────────────┐
│  [VIDEO PLAYING IN BACKGROUND]      │
│  ┌─────────────────────────────┐    │
│  │  WAYNE ENTERPRISES          │    │
│  │                             │    │
│  │     THE ARCHITECT           │    │
│  │                             │    │
│  │  Strategic Systems          │    │
│  └─────────────────────────────┘    │
│                                     │
│  ● SYSTEM ONLINE    03.08.26  14:32 │
└─────────────────────────────────────┘
```

## File Sizes (Typical)

| Source | Duration | Output MP4 | Output WebM |
|--------|----------|------------|-------------|
| YouTube 1080p | 1 min | ~8 MB | ~6 MB |
| YouTube 4K | 1 min | ~20 MB | ~15 MB |

Vercel's free tier allows assets up to 50 MB, so short loops work fine.

## Your Specific Video

URL: `https://www.youtube.com/watch?v=x5zX1eRKEDM`

Just run:
```bash
npm run video:download -- "https://www.youtube.com/watch?v=x5zX1eRKEDM"
```

The script will handle everything and create the optimized files in `/public`.

## Next Steps

1. Copy all files from `vercel-video/` to your project
2. Run the download script
3. Customize `pages/index.tsx` with your content
4. Deploy to Vercel

All files are ready to use.
