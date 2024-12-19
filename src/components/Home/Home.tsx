"use client";

import React from "react";
import Image from "next/image";
// import Authentication from "../auth/Authentication"; #FOR GITHUB AUTH
import SignIn from "../auth/StacksAuth";
import { ConnectWallet } from "../new/ConnectWallet";

export default function Home() {
  return (
    <div className="relative h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        <Image
          src="/logos/aibtcdev-champions-sprint-trading-series-800px.png"
          alt="aibtc.dev"
          width={800}
          height={400}
        />

        <div className="w-full max-w-md px-4">
          {/* Authentication component */}
          <div className="pt-4">
            <ConnectWallet />
          </div>
        </div>
      </div>
    </div>
  );
}
