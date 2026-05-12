import Image from "next/image";

export function FeedMediaGallery({ images }: { images: Array<{ id: string; url: string; alt?: string }> }) {
  if (!images.length) return null;
  if (images.length === 1) return <Image src={images[0].url} alt={images[0].alt ?? "Imagen"} width={700} height={420} className="h-64 w-full rounded-xl object-cover" />;
  if (images.length === 2) return <div className="grid grid-cols-2 gap-2">{images.map((image) => <Image key={image.id} src={image.url} alt={image.alt ?? "Imagen"} width={340} height={220} className="h-44 w-full rounded-xl object-cover" />)}</div>;
  if (images.length === 3) return <div className="grid grid-cols-2 gap-2"><Image src={images[0].url} alt={images[0].alt ?? "Imagen"} width={340} height={300} className="h-[300px] w-full rounded-xl object-cover" /><div className="grid gap-2">{images.slice(1).map((image) => <Image key={image.id} src={image.url} alt={image.alt ?? "Imagen"} width={340} height={145} className="h-[145px] w-full rounded-xl object-cover" />)}</div></div>;
  return <div className="grid grid-cols-2 gap-2">{images.slice(0, 4).map((image) => <Image key={image.id} src={image.url} alt={image.alt ?? "Imagen"} width={340} height={190} className="h-40 w-full rounded-xl object-cover" />)}</div>;
}
