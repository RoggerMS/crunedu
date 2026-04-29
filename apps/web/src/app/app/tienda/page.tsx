"use client";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  title: string;
  description: string;
  price: string;
  isFeatured: boolean;
  category: { name: string };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function Page() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/marketplace/products`)
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, []);

  return (
    <section>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-black tracking-tight">Tienda</h1>
        <p className="mt-2 text-slate-600">Catálogo administrado por CrunEdu para sostener la plataforma.</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm text-slate-600">No hay productos publicados todavía.</p>
          </div>
        ) : (
          products.map((product) => (
            <article key={product.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              {product.isFeatured ? <span className="text-xs font-semibold text-emerald-700">Destacado</span> : null}
              <h2 className="text-lg font-bold">{product.title}</h2>
              <p className="mt-1 text-xs text-slate-500">{product.category?.name}</p>
              <p className="mt-2 text-sm text-slate-600">{product.description}</p>
              <p className="mt-3 font-semibold">S/ {product.price}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
