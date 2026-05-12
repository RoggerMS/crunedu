import Image from "next/image";

export function FeedMediaGallery({ images }: { images: Array<{ id: string; previewUrl?: string; alt?: string }> }) {
  if (!images.length) return null;
  const renderItem = (image: { id: string; previewUrl?: string; alt?: string }, className: string, w: number, h: number) => image.previewUrl ? <Image key={image.id} src={image.previewUrl} alt={image.alt ?? "Imagen"} width={w} height={h} className={className} /> : <div key={image.id} className="flex h-full min-h-24 items-center justify-center rounded-xl border border-dashed text-xs text-slate-500">Imagen adjunta pendiente de sincronización.</div>;
  if (images.length === 1) return renderItem(images[0], "h-64 w-full rounded-xl object-cover", 700, 420);
  if (images.length === 2) return <div className="grid grid-cols-2 gap-2">{images.map((image) => renderItem(image, "h-44 w-full rounded-xl object-cover", 340, 220))}</div>;
  if (images.length === 3) return <div className="grid grid-cols-2 gap-2">{renderItem(images[0], "h-[300px] w-full rounded-xl object-cover", 340, 300)}<div className="grid gap-2">{images.slice(1).map((image) => renderItem(image, "h-[145px] w-full rounded-xl object-cover", 340, 145))}</div></div>;
  return <div className="grid grid-cols-2 gap-2">{images.slice(0, 4).map((image) => renderItem(image, "h-40 w-full rounded-xl object-cover", 340, 190))}</div>;
}
