import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-[#2A2A2A] text-zinc-200 border-zinc-800",
        destructive:
          "border-[#FF1744]/50 text-[#FF1744] dark:border-[#FF1744] [&>svg]:text-[#FF1744] bg-[#2A2A2A]",
        success:
          "border-[#00C853]/50 text-[#00C853] dark:border-[#00C853] [&>svg]:text-[#00C853] bg-[#2A2A2A]",
        warning:
          "border-[#FF6B00]/50 text-[#FF6B00] dark:border-[#FF6B00] [&>svg]:text-[#FF6B00] bg-[#2A2A2A]",
        info: "border-[#7C4DFF]/50 text-[#7C4DFF] dark:border-[#7C4DFF] [&>svg]:text-[#7C4DFF] bg-[#2A2A2A]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "mb-1 font-medium leading-none tracking-tight text-base",
      className
    )}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-zinc-400 [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
