# Batcave Dashboard with Video Background

Homepage with muted, looping video background and Bruce Wayne/Batcave aesthetic.

## Setup

### 1. Download and optimize video

**Option A: Using Node.js script**
```bash
npm install
npm run video:download
```

**Option B: Using Bash script**
```bash
chmod +x download-background.sh
./download-background.sh
```

**Option C: Custom URL**
```bash
npm run video:download -- "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
```

### 2. What the script does

- Downloads YouTube video (highest quality, no audio)
- Resizes to 1920px width (maintains aspect ratio)
- Optimizes MP4 with H.264 codec (high quality, web-ready)
- Creates WebM fallback (better compression)
- Outputs to `/public` folder

### 3. Run development server

```bash
npm run dev
```

### 4. Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

## File Structure

```
/
├── components/
│   └── VideoBackground.tsx    # Video background component
├── pages/
│   └── index.tsx              # Homepage with Batcave styling
├── public/
│   ├── background.mp4         # Auto-generated video (primary)
│   ├── background.webm        # Auto-generated video (fallback)
│   └── background-poster.jpg  # Static poster (optional)
├── download-video.js          # Node.js download script
├── download-background.sh     # Bash download script
└── package.json
```

## Video Optimization Settings

The script uses these ffmpeg settings for optimal web delivery:

- **Codec:** H.264 (libx264) for MP4, VP9 for WebM
- **Preset:** slow (better compression)
- **CRF:** 28 (good quality, reasonable file size)
- **Max width:** 1920px (scales down for smaller screens)
- **Fast start:** Enabled (video plays while downloading)

Expected file sizes:
- 1-minute 1080p video: ~5-15 MB
- 1-minute 4K video: ~15-30 MB

## Customization

### Change video opacity
Edit `components/VideoBackground.tsx`:
```tsx
className="... opacity-60"  // Change this value (0-1)
```

### Darken/lighten overlay
```tsx
<div className="absolute inset-0 bg-black/50" />  // Change /50 to /30 (lighter) or /70 (darker)
```

### Change colors
Edit the CSS variables in `pages/index.tsx`:
```css
--bat-void: #050505;      /* Background */
--bat-amber: #ff9f00;     /* Primary accent */
--bat-steel: #2a2a2a;     /* Secondary */
```

## Troubleshooting

### Video not playing
- Check browser console for errors
- Verify video files exist in `/public`
- Some browsers block autoplay without user interaction

### File too large
- Edit script: change `-crf 28` to `-crf 35` (smaller file, lower quality)
- Add `-vf "scale=1280:-2"` for smaller resolution

### yt-dlp not found
```bash
pip install yt-dlp
# or
npm install -g yt-dlp
```

### ffmpeg not found
**macOS:** `brew install ffmpeg`
**Ubuntu:** `sudo apt install ffmpeg`
**Windows:** `choco install ffmpeg`

## License

Your content here.
