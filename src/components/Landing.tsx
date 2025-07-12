import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BsGithub, BsTwitterX, BsDiscord } from "react-icons/bs";
import { LiaBookSolid } from "react-icons/lia";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative w-full h-[100vh]">
        {/* Background Pattern */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/logos/aibtcdev-pattern-1-1920px.png"
            alt="AIBTC Background Pattern"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="flex flex-col items-center space-y-8 sm:space-y-10 -mt-10 sm:-mt-20">
            {/* Logo */}
            <div className="w-full max-w-[280px] sm:max-w-[500px] md:max-w-[700px] lg:max-w-[800px] px-4">
              <Image
                src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
                alt="AIBTC Logo"
                width={1000}
                height={250}
                className="w-full h-auto"
                priority
              />
            </div>

            {/* Button */}
            <Link
              href="https://www.addevent.com/event/UM20108233"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-[200px] sm:max-w-[250px] md:max-w-[300px]"
            >
              <Button
                size="lg"
                className="sm:text-lg font-bold px-6 py-2 h-auto sm:px-8 sm:py-3 w-full"
                variant="primary"
              >
                RSVP THURSDAYS
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer overlay */}
        <footer className="absolute bottom-0 left-0 right-0 py-6 px-6">
          <div className="container mx-auto flex justify-center">
            <div className="flex items-center space-x-4 sm:space-x-8">
              <Link
                href="https://docs.aibtc.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="backdrop-blur-sm bg-white/10 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full transition-colors hover:bg-primary hover:text-white"
                aria-label="Documentation"
              >
                <LiaBookSolid className="w-5 h-5 sm:w-6 sm:h-6 transition-colors" />
              </Link>
              <Link
                href="https://github.com/aibtcdev"
                target="_blank"
                rel="noopener noreferrer"
                className="backdrop-blur-sm bg-white/10 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full transition-colors hover:bg-primary hover:text-white"
                aria-label="GitHub"
              >
                <BsGithub className="w-5 h-5 sm:w-6 sm:h-6 transition-colors" />
              </Link>
              <Link
                href="https://discord.com/invite/Z59Z3FNbEX"
                target="_blank"
                rel="noopener noreferrer"
                className="backdrop-blur-sm bg-white/10 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full transition-colors hover:bg-primary hover:text-white"
                aria-label="Discord"
              >
                <BsDiscord className="w-5 h-5 sm:w-6 sm:h-6 transition-colors" />
              </Link>
              <Link
                href="https://x.com/aibtcdev"
                target="_blank"
                rel="noopener noreferrer"
                className="backdrop-blur-sm bg-white/10 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full transition-colors hover:bg-primary hover:text-white"
                aria-label="Twitter"
              >
                <BsTwitterX className="w-5 h-5 sm:w-6 sm:h-6 transition-colors" />
              </Link>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
