const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Config
const VIDEO_URL = process.argv[2] || 'https://www.youtube.com/watch?v=x5zX1eRKEDM';
const OUTPUT_DIR = process.argv[3] || './public';
const OUTPUT_NAME = 'background';

console.log('=== Downloading background video ===');
console.log(`URL: ${VIDEO_URL}`);
console.log(`Output: ${path.join(OUTPUT_DIR, OUTPUT_NAME)}.{mp4,webm}\n`);

// Check dependencies
try {
  execSync('yt-dlp --version', { stdio: 'ignore' });
} catch {
  console.log('yt-dlp not found. Installing...');
  execSync('npm install -g yt-dlp', { stdio: 'inherit' });
}

try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
} catch {
  console.error('ffmpeg not found. Please install:');
  console.error('  Ubuntu/Debian: sudo apt install ffmpeg');
  console.error('  macOS: brew install ffmpeg');
  console.error('  Windows: choco install ffmpeg');
  process.exit(1);
}

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const tempFile = path.join('/tmp', `${OUTPUT_NAME}_raw.mp4`);
const outputMp4 = path.join(OUTPUT_DIR, `${OUTPUT_NAME}.mp4`);
const outputWebm = path.join(OUTPUT_DIR, `${OUTPUT_NAME}.webm`);

// Download
try {
  console.log('Step 1: Downloading from YouTube...');
  execSync(`yt-dlp -f "bestvideo[ext=mp4]/best[ext=mp4]" --no-audio -o "${tempFile}" "${VIDEO_URL}"`, {
    stdio: 'inherit'
  });
} catch (err) {
  console.error('Download failed:', err.message);
  process.exit(1);
}

// Get video info
const probeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${tempFile}"`;
const [width, height] = execSync(probeCmd).toString().trim().split('x').map(Number);
console.log(`Original resolution: ${width}x${height}\n`);

// Optimize MP4
try {
  console.log('Step 2: Optimizing MP4 for web...');
  const targetWidth = Math.min(width, 1920);
  execSync(`ffmpeg -y -i "${tempFile}" -an -c:v libx264 -preset slow -crf 28 -vf "scale=${targetWidth}:-2,format=yuv420p" -movflags +faststart -pix_fmt yuv420p "${outputMp4}"`, {
    stdio: 'inherit'
  });
} catch (err) {
  console.error('MP4 conversion failed:', err.message);
}

// Create WebM
try {
  console.log('\nStep 3: Creating WebM fallback...');
  const targetWidth = Math.min(width, 1920);
  execSync(`ffmpeg -y -i "${tempFile}" -an -c:v libvpx-vp9 -crf 35 -b:v 0 -vf "scale=${targetWidth}:-2,format=yuv420p" "${outputWebm}"`, {
    stdio: 'inherit'
  });
} catch (err) {
  console.error('WebM conversion failed:', err.message);
}

// Cleanup
fs.unlinkSync(tempFile);

// Report
console.log('\n=== Complete ===');
console.log('Files created:');
if (fs.existsSync(outputMp4)) {
  const stats = fs.statSync(outputMp4);
  console.log(`  ✓ MP4: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}
if (fs.existsSync(outputWebm)) {
  const stats = fs.statSync(outputWebm);
  console.log(`  ✓ WebM: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

// Create components directory and sample component
const componentsDir = './components';
const componentFile = path.join(componentsDir, 'VideoBackground.tsx');

if (!fs.existsSync(componentFile)) {
  console.log('\nCreating sample component...');
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }
  
  const componentCode = `export default function VideoBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-1/2 left-1/2 min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 object-cover"
        poster="/background-poster.jpg"
      >
        <source src="/background.mp4" type="video/mp4" />
        <source src="/background.webm" type="video/webm" />
      </video>
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
}`;
  
  fs.writeFileSync(componentFile, componentCode);
  console.log(`Created: ${componentFile}`);
}

console.log('\nNext steps:');
console.log('1. Test the video in your browser');
console.log('2. Import VideoBackground in your homepage');
console.log('3. Deploy to Vercel');
console.log('\nDone!');
