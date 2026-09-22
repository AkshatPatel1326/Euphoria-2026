"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  type Variants,
  type HTMLMotionProps,
} from "framer-motion";

interface BlurFadeProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  blur?: number;
  inView?: boolean;
  inViewMargin?: string;
  once?: boolean;
}

const blurFadeVariants = (
  yOffset: number,
  blur: number,
): Variants => ({
  hidden: {
    opacity: 0,
    y: yOffset,
    filter: `blur(${blur}px)`,
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
});

export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.28,
  yOffset = 10,
  blur = 3,
  inView = true,
  inViewMargin = "-20px",
  once = true,
  ...motionProps
}: BlurFadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once,
    margin: inViewMargin as any,
  });

  return (
    <motion.div
      ref={ref}
      variants={blurFadeVariants(yOffset, blur)}
      initial="hidden"
      animate={inView && isInView ? "visible" : "hidden"}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
