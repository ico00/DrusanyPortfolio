"use client";

import Image from "next/image";
import { useState } from "react";

interface AboutImageProps {
  src: string;
  alt?: string;
}

export default function AboutImage({ src, alt = "" }: AboutImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className="h-full w-full bg-gradient-to-b from-zinc-800 to-zinc-900"
        aria-hidden
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover object-center"
      sizes="50vw"
      priority
      onError={() => setError(true)}
    />
  );
}
