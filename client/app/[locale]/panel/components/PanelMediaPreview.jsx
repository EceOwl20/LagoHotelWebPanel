"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { observeMediaPreview } from "@/lib/admin/observe-media-preview.mjs";

function Preview({ src, alt = "", className = "object-cover", onLoad, sizes = "320px" }) {
  const container = useRef(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => observeMediaPreview(container.current, () => setVisible(true)), []);
  return (
    <div ref={container} className="absolute inset-0">
      {visible && src && !failed ? (
        <Image src={src} alt={alt} fill unoptimized loading="lazy" decoding="async"
          sizes={sizes} className={className} onLoad={onLoad} onError={() => setFailed(true)} />
      ) : null}
      {failed || !src ? (
        <span role="img" aria-label={alt || "Görsel yüklenemedi"}
          className="absolute inset-0 flex items-center justify-center bg-stone-100 p-3 text-center text-xs text-stone-500">
          Önizleme yüklenemedi
        </span>
      ) : null}
    </div>
  );
}

export default function PanelMediaPreview(props) {
  // A changed source gets fresh visibility/error state; late events cannot affect it.
  return <Preview key={props.src || "empty"} {...props} />;
}
