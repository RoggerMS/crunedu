export function RatingControl({ value, onRate }: { value?: number; onRate: (value: number) => void }) {
  return <div className="flex gap-1">{[1,2,3,4,5].map((n)=><button key={n} type="button" aria-label={`Valorar ${n}`} onClick={()=>onRate(n)} className={`text-sm ${n <= (value ?? 0) ? "text-amber-500" : "text-slate-300"}`}>★</button>)}</div>;
}
