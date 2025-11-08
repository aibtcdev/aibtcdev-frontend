"use client";

import React from "react";
import Image from "next/image";

export const WavyBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Pattern background image */}
      <div className="absolute inset-0">
        <Image
          src="/logos/aibtcdev-pattern-1-1920px.png"
          alt="Background pattern"
          fill
          className="object-cover opacity-50"
          priority
          quality={100}
        />

        {/* Dark gradient overlay from top-left to bottom-right */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-black/40" />
      </div>
    </div>
  );
};
