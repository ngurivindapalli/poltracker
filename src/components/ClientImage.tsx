"use client";

import Image, { ImageProps } from "next/image";
import { useMemo, useState } from "react";

type Props = ImageProps & {
  fallbackSrc?: string;
};

export default function ClientImage({ fallbackSrc = "/images/placeholder-avatar.svg", ...props }: Props) {
  const [src, setSrc] = useState(props.src);

  const safeSrc = useMemo(() => src, [src]);

  return (
    <Image
      {...props}
      src={safeSrc}
      onError={() => setSrc(fallbackSrc)}
    />
  );
}
