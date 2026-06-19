"use client";

import { useEffect, useState } from "react";

type GalleryImage = {
  id: number | string;
  url: string;
  alt?: string;
};

type ImageGalleryProps = {
  images: GalleryImage[];
  alt?: string;
  smallImages?: boolean;
};

export function ImageGallery({ images, alt = "Imagen adjunta", smallImages = false }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (activeIndex > images.length - 1) setActiveIndex(0);
  }, [images.length, activeIndex]);

  if (!images.length) return null;
  const active = images[Math.min(activeIndex, images.length - 1)];

  return (
    <div className="space-y-3">
      <div className={`overflow-hidden rounded-2xl border bg-slate-50 ${smallImages ? "max-w-md" : "max-w-2xl"}`}>
        <button type="button" onClick={() => setLightbox(true)} className="group block w-full" aria-label="Ampliar imagen">
          <img src={active.url} alt={active.alt ?? alt} className={`${smallImages ? "max-h-56" : "max-h-96"} w-full object-contain transition group-hover:brightness-95`} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`relative h-16 w-20 overflow-hidden rounded-lg border-2 ${index === activeIndex ? "border-indigo-500" : "border-slate-200"}`}
            aria-label={`Ver imagen ${index + 1}`}
          >
            <img src={image.url} alt={image.alt ?? alt} className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
        <a href={active.url} target="_blank" rel="noreferrer" className="flex h-16 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">Abrir en nueva pestaña</a>
      </div>
      {lightbox ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(false)} role="dialog" aria-modal="true">
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-slate-900" onClick={() => setLightbox(false)} aria-label="Cerrar">Cerrar</button>
          <img src={active.url} alt={active.alt ?? alt} className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </div>
  );
}
