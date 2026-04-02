// components/AircraftLayer.tsx - Military aircraft tracking overlay
'use client';

import { useEffect, useRef, useState } from 'react';
import { useAircraftTracking, Aircraft } from '@/hooks/useLiveData';

interface AircraftLayerProps {
  enabled: boolean;
  onAircraftSelect?: (aircraft: Aircraft) => void;
}

export function AircraftLayer({ enabled, onAircraftSelect }: AircraftLayerProps) {
  const { aircraft, lastUpdate, count } = useAircraftTracking(enabled);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render aircraft on canvas overlay (simplified)
  // In production, integrate with your 3D globe's coordinate system
  useEffect(() => {
    if (!enabled || !canvasRef.current || aircraft.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw aircraft positions
    aircraft.forEach((ac) => {
      if (ac.lat && ac.lon) {
        // Convert lat/lon to canvas coordinates (simplified)
        const x = ((ac.lon + 180) / 360) * canvas.width;
        const y = ((90 - ac.lat) / 180) * canvas.height;

        // Draw aircraft icon
        ctx.fillStyle = '#f59e0b'; // Amber for military
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw flight trail (if speed available)
        if (ac.speed > 0 && ac.track !== undefined) {
          const trailLength = Math.min(ac.speed / 50, 20);
          const angle = (ac.track * Math.PI) / 180;
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(
            x - Math.sin(angle) * trailLength,
            y - Math.cos(angle) * trailLength
          );
          ctx.stroke();
        }
      }
    });
  }, [aircraft, enabled]);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="w-full h-full"
      />
      
      {/* Aircraft count badge */}
      <div className="absolute top-4 right-4 bg-black/80 border border-amber-500/30 rounded px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs text-amber-500 font-mono">
            MILITARY AIRCRAFT: {count}
          </span>
        </div>
        {lastUpdate && (
          <div className="text-[10px] text-zinc-500 mt-1">
            UPDATED: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
