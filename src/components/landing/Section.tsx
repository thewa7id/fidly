"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  animate?: boolean;
}

export function Section({ children, className, id, animate = true }: SectionProps) {
  if (!animate) {
    return (
      <section id={id} className={cn("py-20 md:py-32 overflow-hidden", className)}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn("py-20 md:py-32 overflow-hidden", className)}
    >
      {children}
    </motion.section>
  );
}
