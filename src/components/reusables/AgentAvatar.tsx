import { Bot } from "lucide-react";
import Image from "next/image";
import type { Agent } from "@/types";

interface AgentAvatarProps {
  agent?: Agent;
  className?: string;
}

/**
 * AgentAvatar Component
 * Displays either a custom avatar image for an agent or a default bot icon
 *
 * @param agent - The agent object containing image and name information
 * @param className - Additional CSS classes for styling
 */
export function AgentAvatar({ agent, className = "" }: AgentAvatarProps) {
  // If no agent image is provided, show default bot icon
  if (!agent?.image_url) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-background ${className}`}
      >
        <Bot className="h-5 w-5 text-foreground/50" />
      </div>
    );
  }

  // Display agent's custom avatar with first letter overlay
  return (
    <div className={`relative rounded-full overflow-hidden ${className}`}>
      <Image
        src={agent.image_url || "/placeholder.svg"}
        alt={agent.name}
        height={24}
        width={24}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
        <span className="text-lg font-bold text-white">
          {agent.name.charAt(0).toUpperCase()}
        </span>
      </div>
    </div>
  );
}
