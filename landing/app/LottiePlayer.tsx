"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function LottiePlayer({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  return (
    <div className={className} aria-hidden="true">
      <DotLottieReact src={src} loop autoplay />
    </div>
  );
}
