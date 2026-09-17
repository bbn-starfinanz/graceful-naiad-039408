"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-[1.8rem] border border-border bg-black/40 shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
      <video
        ref={videoRef}
        className="aspect-video w-full bg-black"
        controls
        poster={poster}
        preload="metadata"
        src={src}
      />
      <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-3 text-xs uppercase tracking-[0.18em] text-accent-strong">
        <span>Video Vault</span>
        <span>{isPlaying ? "Playing" : "Paused"}</span>
      </div>
    </div>
  );
}
