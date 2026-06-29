"use client";

import { useState } from "react";
import Image from "next/image";
import { getMediaUrl, MediaType, getMediaAlt } from "@/lib/media/assets";

interface MediaImageProps {
  type: MediaType;
  slug: string;
  name?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
}

export function MediaImage({ type, slug, name, width = 800, height = 600, fill, className, priority }: MediaImageProps) {
  const [src, setSrc] = useState(getMediaUrl({ type, slug, name, width: fill ? 800 : width, height: fill ? 600 : height }));
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className || ""}`}
        style={fill ? undefined : { width, height }}
        aria-label={getMediaAlt(type, name)}
      >
        <span className="text-sm font-medium">{name ? name.slice(0, 2).toUpperCase() : type.slice(0, 2).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={getMediaAlt(type, name)}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      className={`object-cover ${className || ""}`}
      onError={() => setError(true)}
      priority={priority}
      sizes={fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined}
    />
  );
}
