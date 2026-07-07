import React from "react";

interface ImagePlaceholderProps {
  aspectRatio?: string; // e.g. "aspect-video" or "aspect-square"
  label?: string;
  className?: string;
}

export default function ImagePlaceholder({
  aspectRatio = "aspect-video",
  label = "Empty Slot",
  className = ""
}: ImagePlaceholderProps) {
  return (
    <div
      className={`relative w-full ${aspectRatio} rounded-lg border-2 border-dashed border-white/10 bg-zinc-800/50 flex flex-col items-center justify-center gap-2 group-hover:bg-zinc-800/80 transition-colors duration-300 ${className}`}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        className="text-zinc-600 group-hover:text-violet-500 transition-colors duration-300"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 group-hover:text-violet-400 transition-colors duration-300">
        No Preview Loaded
      </span>
    </div>
  );
}
