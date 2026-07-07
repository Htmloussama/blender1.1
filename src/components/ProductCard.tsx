import React from "react";
import { ArrowRight, Box, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Asset } from "../types";
import ImagePlaceholder from "./ImagePlaceholder";

interface ProductCardProps {
  key?: React.Key;
  asset: Asset;
  onClick: () => void;
}

export default function ProductCard({ asset, onClick }: ProductCardProps) {
  const isFree = asset.price === 0;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onClick}
      className="group relative flex flex-col justify-between bg-zinc-900/40 border border-white/10 rounded-2xl p-4 overflow-hidden shadow-lg cursor-pointer hover:border-violet-500/40 transition-all duration-300"
    >
      {/* Background soft radial glow behind cards on hover */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-violet-500/0 via-violet-500/0 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div>
        {/* Empty image placeholder - fully styled, strictly empty as per constraints */}
        <div className="relative overflow-hidden rounded-xl bg-zinc-950">
          <ImagePlaceholder aspectRatio="aspect-[4/3]" label={asset.category} className="group-hover:bg-zinc-800/80" />
          
          {/* Category Badge over image */}
          <span className="absolute top-3 left-3 px-2.5 py-1 text-[9px] font-mono tracking-wider font-semibold uppercase text-violet-300 bg-violet-950/40 border border-violet-500/20 backdrop-blur-md rounded-full">
            {asset.category}
          </span>

          {/* Pricing overlay badge */}
          <span
            className={`absolute top-3 right-3 px-3 py-1 text-[10px] font-mono font-bold rounded-lg border backdrop-blur-md ${
              isFree
                ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-400"
                : "bg-violet-950/40 border-violet-500/20 text-violet-300"
            }`}
          >
            {isFree ? "FREE" : `$${asset.price.toFixed(2)}`}
          </span>
        </div>

        {/* Content detail */}
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
              .BLEND FORMAT
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span className="text-[10px] font-mono uppercase text-zinc-500">
              {asset.downloadsCount} download{asset.downloadsCount !== 1 && "s"}
            </span>
          </div>

          <h3 className="font-display font-bold text-zinc-200 group-hover:text-white text-base tracking-tight transition-colors">
            {asset.title}
          </h3>

          <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
            {asset.description}
          </p>
        </div>
      </div>

      {/* Footer trigger */}
      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
        <span className="text-zinc-500 group-hover:text-zinc-400 transition-colors">
          View asset specifications
        </span>
        <div className="flex items-center gap-1 text-violet-400 group-hover:text-violet-300 transition-colors">
          <span className="text-[10px] tracking-wider uppercase font-semibold">Inspect</span>
          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}
