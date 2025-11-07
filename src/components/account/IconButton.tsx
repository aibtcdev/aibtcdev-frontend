"use client";

import type React from "react";

interface IconButtonProps {
  icon: React.ElementType;
  onClick?: () => void;
  href?: string;
  copied?: boolean;
  size?: "sm" | "xs";
}

export function IconButton({
  icon: Icon,
  onClick,
  href,
  copied = false,
  size = "sm",
}: IconButtonProps) {
  const sizeClasses = size === "xs" ? "w-6 h-6" : "w-8 h-8";
  const iconSize = size === "xs" ? "h-3 w-3" : "h-4 w-4";

  const content = (
    <div
      className={`${sizeClasses} rounded-sm hover:bg-muted/50 flex items-center justify-center cursor-pointer transition-colors`}
    >
      <Icon
        className={`${iconSize} ${copied ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
      />
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <div onClick={onClick}>{content}</div>;
}
