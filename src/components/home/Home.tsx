"use client";

import React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { PrivacyPolicy } from "@/components/terms-and-condition/PrivacyPolicy";
import { TermsOfService } from "@/components/terms-and-condition/TermsOfService";

const SignIn = dynamic(() => import("@/components/auth/StacksAuth"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-900 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <Image
        src="/logos/aibtcdev-pattern-1-1920px.png"
        alt="AIBTC.DEV Waves Background"
        layout="fill"
        objectFit="cover"
        quality={100}
        priority
        className="absolute inset-0 z-0 opacity-80"
      />
      <div className="relative z-10 w-full max-w-md space-y-6 p-6 sm:p-8 bg-zinc-800/90 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl border border-zinc-700">
        {/* Logo Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Image
              alt="AIBTC.DEV"
              src="/logos/aibtcdev-avatar-250px.png"
              height={48}
              width={48}
              priority
              className="rounded-full shadow-lg"
            />
            <Image
              alt="AIBTC.DEV"
              src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
              height={80}
              width={240}
              priority
              className="w-56 sm:w-64 h-auto object-contain"
            />
          </div>
          <p className="text-zinc-200 text-sm font-medium text-center">
            Connect your wallet to get started
          </p>
        </div>

        {/* Sign In Section */}
        <div className="space-y-6">
          <SignIn />

          {/* Terms and Privacy Section */}
          <div className="text-center space-y-2">
            <p className="text-xs text-zinc-400 leading-relaxed px-4">
              By connecting your wallet, you agree to our{" "}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" className="p-0 h-auto font-medium">
                    Terms of Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                      Terms of Service
                    </DialogTitle>
                    <DialogDescription className="text-sm text-zinc-400">
                      Please read our Terms of Service carefully.
                    </DialogDescription>
                  </DialogHeader>
                  <TermsOfService />
                </DialogContent>
              </Dialog>{" "}
              and{" "}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" className=" p-0 h-auto font-medium">
                    Privacy Policy
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                      Privacy Policy
                    </DialogTitle>
                    <DialogDescription className="text-sm text-zinc-400">
                      Please read our Privacy Policy carefully.
                    </DialogDescription>
                  </DialogHeader>
                  <PrivacyPolicy />
                </DialogContent>
              </Dialog>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
