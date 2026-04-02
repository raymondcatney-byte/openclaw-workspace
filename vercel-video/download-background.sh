#!/bin/bash

# Download and optimize YouTube video for homepage background
# Usage: ./download-background.sh [YOUTUBE_URL]

VIDEO_URL="${1:-https://www.youtube.com/watch?v=x5zX1eRKEDM}"
OUTPUT_DIR="${2:-./public}"
OUTPUT_NAME="${3:-background}"

echo "=== Downloading background video ==="
echo "URL: $VIDEO_URL"
echo "Output: $OUTPUT_DIR/$OUTPUT_NAME.mp4"
echo ""

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "yt-dlp not found. Installing..."
    pip install yt-dlp
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "ffmpeg not found. Please install:"
    echo "  Ubuntu/Debian: sudo apt install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    echo "  Windows: choco install ffmpeg"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Download best video quality (no audio)
echo "Step 1: Downloading from YouTube..."
yt-dlp -f "bestvideo[ext=mp4]/best[ext=mp4]" \
    --no-audio \
    --output "/tmp/${OUTPUT_NAME}_raw.%(ext)s" \
    "$VIDEO_URL"

# Find the downloaded file
DOWNLOADED=$(ls /tmp/${OUTPUT_NAME}_raw.* 2>/dev/null | head -1)

if [ -z "$DOWNLOADED" ]; then
    echo "Error: Download failed"
    exit 1
fi

echo "Downloaded: $DOWNLOADED"

# Get video dimensions
WIDTH=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=s=x:p=0 "$DOWNLOADED")
HEIGHT=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=s=x:p=0 "$DOWNLOADED")
echo "Original resolution: ${WIDTH}x${HEIGHT}"

# Calculate target height for 1920 width (maintain aspect ratio)
TARGET_WIDTH=1920
if [ "$WIDTH" -gt "$TARGET_WIDTH" ]; then
    SCALE_FILTER="scale=${TARGET_WIDTH}:-2"
    echo "Resizing to ${TARGET_WIDTH}w (maintaining aspect ratio)"
else
    SCALE_FILTER="scale=${WIDTH}:-2"
    echo "Keeping original width: ${WIDTH}"
fi

# Optimize for web: mute, compress, fast start for streaming
echo ""
echo "Step 2: Optimizing for web..."
ffmpeg -y -i "$DOWNLOADED" \
    -an \
    -c:v libx264 \
    -preset slow \
    -crf 28 \
    -vf "$SCALE_FILTER,format=yuv420p" \
    -movflags +faststart \
    -pix_fmt yuv420p \
    "${OUTPUT_DIR}/${OUTPUT_NAME}.mp4"

# Also create a WebM version for better browser compatibility
echo ""
echo "Step 3: Creating WebM fallback..."
ffmpeg -y -i "$DOWNLOADED" \
    -an \
    -c:v libvpx-vp9 \
    -crf 35 \
    -b:v 0 \
    -vf "$SCALE_FILTER,format=yuv420p" \
    "${OUTPUT_DIR}/${OUTPUT_NAME}.webm"

# Clean up raw download
rm -f "$DOWNLOADED"

# Report file sizes
echo ""
echo "=== Complete ==="
echo "Files created:"
ls -lh "${OUTPUT_DIR}/${OUTPUT_NAME}.mp4" 2>/dev/null && echo "  - MP4 (primary)"
ls -lh "${OUTPUT_DIR}/${OUTPUT_NAME}.webm" 2>/dev/null && echo "  - WebM (fallback)"

echo ""
echo "Next steps:"
echo "1. Test the video: open ${OUTPUT_DIR}/${OUTPUT_NAME}.mp4"
echo "2. Update your homepage component to use the video"
echo "3. Deploy to Vercel"

# Create a sample component if it doesn't exist
COMPONENT_FILE="./components/VideoBackground.tsx"
if [ ! -f "$COMPONENT_FILE" ]; then
    echo ""
    echo "Creating sample component..."
    mkdir -p ./components
    cat > "$COMPONENT_FILE" << 'EOF'
export default function VideoBackground() {
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
}
EOF
    echo "Created: $COMPONENT_FILE"
fi

echo ""
echo "Done!"
