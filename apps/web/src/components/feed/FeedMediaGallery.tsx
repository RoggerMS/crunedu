import Image from "next/image";

type MediaItem = { id: string; type?: "image" | "video"; previewUrl?: string; alt?: string; unavailableLabel?: string };

export function FeedMediaGallery({ images, onSelect }: { images: MediaItem[]; onSelect?: (index: number) => void }) {
  if (!images.length) return null;
  const renderItem = (image: MediaItem, className: string, w: number, h: number, index: number) => !image.previewUrl ? <button key={image.id} onClick={() => onSelect?.(index)} className="flex h-full min-h-24 w-full cursor-pointer items-center justify-center rounded-xl border border-dashed text-xs text-slate-500">{image.unavailableLabel ?? "Imagen pendiente de sincronización."}</button> : <button key={image.id} onClick={() => onSelect?.(index)} className="group relative w-full cursor-pointer overflow-hidden rounded-xl"><Image src={image.previewUrl} alt={image.alt ?? "Imagen"} width={w} height={h} className={`${className} transition group-hover:brightness-95`} />{image.type === "video" ? <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white">Video</span> : null}</button>;
  if (images.length === 1) return renderItem(images[0], "h-72 w-full object-cover", 700, 420, 0);
  if (images.length === 2) return <div className="grid grid-cols-2 gap-2">{images.map((image, index) => renderItem(image, "h-48 w-full object-cover", 340, 220, index))}</div>;
  if (images.length === 3) return <div className="grid grid-cols-2 gap-2">{renderItem(images[0], "h-[320px] w-full object-cover", 340, 300, 0)}<div className="grid gap-2">{images.slice(1).map((image, idx) => renderItem(image, "h-[156px] w-full object-cover", 340, 145, idx + 1))}</div></div>;
  return <div className="grid grid-cols-2 gap-2">{images.slice(0, 4).map((image, index) => renderItem(image, "h-44 w-full object-cover", 340, 190, index))}</div>;
}
