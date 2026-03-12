"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { type VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BrandButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  glow?: boolean;
}

export function BrandButton({ className, variant, size, glow, children, ...props }: BrandButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-block"
    >
      <Button
        variant={variant}
        size={size}
        className={cn(
          "relative font-semibold transition-all duration-300",
          glow && "shadow-[0_0_20px_rgba(234,144,16,0.3)] hover:shadow-[0_0_25px_rgba(234,144,16,0.5)]",
          variant === "outline" 
            ? "border-primary/50 text-white bg-white/5 hover:bg-primary/10 hover:border-primary" 
            : "bg-primary hover:bg-[#F2A93A] text-white border-0",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  );
}
