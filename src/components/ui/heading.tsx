import * as React from "react";
import { clsx } from "clsx";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function Heading({ className, level = 1, ...props }: HeadingProps) {
  const Element: `h${typeof level}` = `h${level}`;

  const sizeClasses = {
    1: "text-2xl md:text-3xl font-bold",
    2: "text-xl md:text-2xl font-semibold",
    3: "text-lg md:text-xl font-semibold",
    4: "text-base md:text-lg font-medium",
    5: "text-sm md:text-base font-medium",
    6: "text-xs md:text-sm font-medium",
  };

  return (
    <Element
      {...props}
      className={clsx(
        className,
        sizeClasses[level],
        "text-white leading-tight tracking-tight"
      )}
    />
  );
}

export function Subheading({ className, level = 2, ...props }: HeadingProps) {
  const Element: `h${typeof level}` = `h${level}`;

  return (
    <Element
      {...props}
      className={clsx(
        className,
        "text-base/7 font-semibold text-zinc-950 sm:text-sm/6 dark:text-white"
      )}
    />
  );
}
