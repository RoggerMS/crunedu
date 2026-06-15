import { ReactNode } from "react";

type AcademicContentImage = {
  id: number | string;
  imageUrl?: string;
  previewUrl?: string;
  alt?: string;
};

type AcademicContentRendererProps = {
  content: string;
  images?: AcademicContentImage[];
  imageAlt?: string;
  resolveImageUrl?: (imageUrl: string) => string;
  smallImages?: boolean;
};

export function AcademicContentRenderer({ content, images = [], imageAlt = "Imagen adjunta", resolveImageUrl = (url) => url, smallImages = false }: AcademicContentRendererProps) {
  const blocks = buildBlocks(content);
  return (
    <div className="space-y-3 text-slate-700">
      {blocks.map((block, index) => {
        if (block.type === "ul") return <ul key={index} className="list-disc space-y-1 pl-5 text-sm sm:text-base">{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ul>;
        if (block.type === "ol") return <ol key={index} className="list-decimal space-y-1 pl-5 text-sm sm:text-base">{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}</ol>;
        return <p key={index} className="whitespace-pre-wrap text-sm leading-6 sm:text-base">{renderInline(block.text)}</p>;
      })}
      {images.length ? <div className={`grid gap-3 ${smallImages ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{images.map((image) => {
        const src = image.previewUrl ?? (image.imageUrl ? resolveImageUrl(image.imageUrl) : "");
        if (!src) return null;
        return <a key={image.id} href={src} target="_blank" rel="noreferrer" className="overflow-hidden rounded-2xl border bg-slate-50"><img src={src} alt={image.alt ?? imageAlt} className={`${smallImages ? "max-h-52" : "max-h-[420px]"} w-full object-contain`} /></a>;
      })}</div> : null}
    </div>
  );
}

function buildBlocks(content: string) {
  const blocks: Array<{ type: "p"; text: string } | { type: "ul" | "ol"; items: string[] }> = [];
  for (const line of content.split("\n")) {
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (bullet) pushList(blocks, "ul", bullet[1]);
    else if (numbered) pushList(blocks, "ol", numbered[1]);
    else if (line.trim()) blocks.push({ type: "p", text: line });
  }
  return blocks;
}

function pushList(blocks: Array<{ type: "p"; text: string } | { type: "ul" | "ol"; items: string[] }>, type: "ul" | "ol", item: string) {
  const last = blocks[blocks.length - 1];
  if (last?.type === type) last.items.push(item);
  else blocks.push({ type, items: [item] });
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|~~[^~]+~~|\*[^*]+\*)/g;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) continue;
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const value = token.replace(/^\*\*|\*\*$|^~~|~~$|^\*|\*$/g, "");
    if (token.startsWith("**")) nodes.push(<strong key={`${match.index}-b`}>{value}</strong>);
    else if (token.startsWith("~~")) nodes.push(<span key={`${match.index}-s`} className="line-through">{value}</span>);
    else nodes.push(<em key={`${match.index}-i`}>{value}</em>);
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
