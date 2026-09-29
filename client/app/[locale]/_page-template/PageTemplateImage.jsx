"use client";
import Image from "next/image";
import { createContext, useContext } from "react";
export const PagePreviewOrigin = createContext("");
export default function PageTemplateImage(props) {
  const origin = useContext(PagePreviewOrigin);
  const remote = origin && typeof props.src === "string" && props.src.startsWith("/uploads/dynamic-pages/");
  // Relative stored paths stay unchanged; only panel previews resolve to Azura.
  return <Image {...props} src={remote ? `${origin}${props.src}` : props.src} unoptimized={remote ? true : props.unoptimized} />;
}
