// pages/index.tsx
// Homepage with video background and Batcave aesthetic

import Head from 'next/head';
import VideoBackground from '../components/VideoBackground';

export default function Home() {
  return (
    <>
      <Head>
        <title>THE ARCHITECT | Strategic Systems</title>
        <meta name="description" content="Architect of Transitions" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Inter:wght@300;400;500;600&display=swap');
          
          :root {
            --bat-void: #050505;
            --bat-amber: #ff9f00;
            --bat-steel: #2a2a2a;
          }
          
          .font-display { font-family: 'Bebas Neue', sans-serif; }
          .font-mono { font-family: 'Share Tech Mono', monospace; }
          .font-body { font-family: 'Inter', sans-serif; }
        `}</style>
      </Head>

      <main className="relative min-h-screen bg-[#050505] text-[#e0e0e0] font-body overflow-hidden">
        {/* Video Background */}
        <VideoBackground />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
          
          {/* Corner brackets decoration */}
          <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-[#8b5a00]" />
          <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-[#8b5a00]" />
          <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-[#8b5a00]" />
          <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-[#8b5a00]" />

          {/* Main Title */}
          <div className="text-center">
            <p className="font-mono text-xs tracking-[0.3em] text-[#8b5a00] mb-4 uppercase">
              Wayne Enterprises // Systems Division
            </p>
            
            <h1 className="font-display text-[8rem] md:text-[12rem] leading-none tracking-[0.15em] text-[#ff9f00] drop-shadow-[0_0_30px_rgba(255,159,0,0.3)]">
              THE ARCHITECT
            </h1>
            
            <p className="font-mono text-sm tracking-[0.2em] text-[#888] mt-6 uppercase">
              Strategic Systems // Transition Architecture
            </p>
          </div>

          {/* Status indicators */}
          <div className="absolute bottom-16 flex gap-12 font-mono text-xs tracking-wider">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ff9f00] rounded-full animate-pulse" />
              <span className="text-[#ff9f00]">SYSTEM ONLINE</span>
            </div>
            <div className="text-[#555]">
              {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              }).replace(/\//g, '.')}
            </div>
            <div className="text-[#555]">
              {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
              })}
            </div>
          </div>

          {/* Navigation hint */}
          <div className="absolute bottom-8 font-mono text-[10px] tracking-[0.2em] text-[#3a3a3a] uppercase">
            Scroll to Enter
          </div>
        </div>
      </main>
    </>
  );
}
