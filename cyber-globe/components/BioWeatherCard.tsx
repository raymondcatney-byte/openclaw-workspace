// components/BioWeatherCard.tsx - Biohacking weather integration for Protocols tab
'use client';

import { useBioWeather, useUserLocation, getWeatherDescription } from '@/hooks/useLiveData';
import { useState } from 'react';

export function BioWeatherCard() {
  const { location } = useUserLocation();
  const { weather, loading, error } = useBioWeather(location?.lat || null, location?.lon || null);
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-zinc-800 rounded w-1/2"></div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-black/40 border border-red-900/30 rounded-lg p-4">
        <div className="text-xs text-red-500 uppercase tracking-wider mb-1">Environmental Data</div>
        <div className="text-sm text-zinc-400">Unable to load weather data</div>
      </div>
    );
  }

  const current = weather.current;
  const daily = weather.daily;
  const airQuality = weather.air_quality?.current;

  // Calculate biohacking scores
  const uvScore = current.uv_index <= 3 ? 'Low' : current.uv_index <= 5 ? 'Moderate' : 'High';
  const outdoorScore = current.weather_code <= 3 && current.wind_speed_10m < 20 ? 'Optimal' : 'Suboptimal';
  
  // Sunrise/sunset times
  const sunrise = daily.sunrise[0]?.split('T')[1] || '06:00';
  const sunset = daily.sunset[0]?.split('T')[1] || '18:00';
  const uvMax = daily.uv_index_max[0];

  return (
    <div className="bg-black/40 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs text-cyan-500 uppercase tracking-wider">Environmental Intelligence</span>
          </div>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Main stats */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Temperature */}
        <div className="space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Temperature</div>
          <div className="text-2xl font-mono text-white">{Math.round(current.temperature_2m)}°C</div>
          <div className="text-xs text-zinc-400">Feels like {Math.round(current.apparent_temperature)}°</div>
        </div>

        {/* UV Index */}
        <div className="space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">UV Index</div>
          <div className={`text-2xl font-mono ${
            current.uv_index <= 3 ? 'text-green-500' : 
            current.uv_index <= 5 ? 'text-yellow-500' : 'text-orange-500'
          }`}>
            {current.uv_index.toFixed(1)}
          </div>
          <div className="text-xs text-zinc-400">{uvScore} • Max: {uvMax}</div>
        </div>

        {/* Sunrise/Sunset */}
        <div className="space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Daylight Window</div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-amber-500">{sunrise}</span>
            <span className="text-zinc-600">→</span>
            <span className="text-sm font-mono text-orange-500">{sunset}</span>
          </div>
          <div className="text-xs text-zinc-400">Sunlight exposure window</div>
        </div>

        {/* Air Quality */}
        <div className="space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">Air Quality (US AQI)</div>
          <div className={`text-2xl font-mono ${
            !airQuality || airQuality.us_aqi <= 50 ? 'text-green-500' :
            airQuality.us_aqi <= 100 ? 'text-yellow-500' :
            airQuality.us_aqi <= 150 ? 'text-orange-500' : 'text-red-500'
          }`}>
            {airQuality?.us_aqi || '—'}
          </div>
          <div className="text-xs text-zinc-400">
            {airQuality?.us_aqi <= 50 ? 'Good for outdoor training' :
             airQuality?.us_aqi <= 100 ? 'Moderate - okay for most' :
             'Consider indoor protocols'}
          </div>
        </div>
      </div>

      {/* Biohacking recommendations */}
      <div className="px-4 pb-4">
        <div className="bg-zinc-900/50 rounded p-3 border border-zinc-800">
          <div className="text-[10px] text-cyan-500 uppercase tracking-wider mb-2">Protocol Recommendations</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className={outdoorScore === 'Optimal' ? 'text-green-500' : 'text-yellow-500'}></>
              <span className={outdoorScore === 'Optimal' ? 'text-green-400' : 'text-yellow-400'}>
                {outdoorScore === 'Optimal' 
                  ? 'Optimal conditions for Morning Activation protocol' 
                  : 'Consider abbreviated outdoor exposure'}
              </span>
            </div>
            
            {current.uv_index < 1 && (
              <div className="flex items-start gap-2">
                <span className="text-amber-500">⚠</span>
                <span className="text-amber-400">Low UV - Vitamin D synthesis minimal. Consider supplementation.</span>
              </div>
            )}
            
            {current.wind_speed_10m > 30 && (
              <div className="flex items-start gap-2">
                <span className="text-red-500">⚠</span>
                <span className="text-red-400">High winds - modify Endurance Block for indoor training.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && airQuality && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Detailed Air Metrics</div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-zinc-900/30 rounded p-2">
              <div className="text-zinc-500">PM2.5</div>
              <div className="font-mono">{airQuality.pm2_5} µg/m³</div>
            </div>
            <div className="bg-zinc-900/30 rounded p-2">
              <div className="text-zinc-500">PM10</div>
              <div className="font-mono">{airQuality.pm10} µg/m³</div>
            </div>
            <div className="bg-zinc-900/30 rounded p-2">
              <div className="text-zinc-500">O₃</div>
              <div className="font-mono">{airQuality.ozone} µg/m³</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
