"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccessToken } from "@/hooks/useAccessToken";
import { PageState, PrimaryButton } from "@/components/ui";
import { getStoreCatalog } from "@/lib/api-helpers";
import { mapApiError } from "@/lib/api";

type Product = {
  id: number;
  title: string;
  description: string;
  price: string;
  isFeatured: boolean;
  category: { name: string };
};


export default function TiendaPage() {
  const { accessToken } = useAccessToken();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadProducts() {
    const params = new URLSearchParams();

    const faculty = typeof window !== "undefined" ? localStorage.getItem("profile_faculty") : "";
    const career = typeof window !== "undefined" ? localStorage.getItem("profile_career") : "";

    if (faculty) params.set("faculty", faculty);
    if (career) params.set("career", career);

    setLoading(true);
    setError(null);

    getStoreCatalog(params)
      .then((data) => {
        setProducts(Array.isArray(data?.items) ? data.items : []);
        setFeaturedProducts(Array.isArray(data?.featuredProducts) ? data.featuredProducts : []);
      })
      .catch((err) => {
        setError(mapApiError(err, "No pudimos cargar la tienda en este momento."));
        setProducts([]);
        setFeaturedProducts([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProducts();
  }, [accessToken]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-black tracking-tight">Tienda CrunEdu</h1>
        <p className="mt-2 text-slate-600">Productos reales para estudiantes. Sin carrito, sin pagos automáticos.</p>
      </div>

      {loading ? (
        <PageState type="loading" title="Cargando tienda" description="Estamos preparando los productos para estudiantes." />
      ) : null}
      {error ? (
        <PageState
          type="error"
          title="No se pudo cargar la tienda"
          description={error}
          action={<PrimaryButton type="button" onClick={loadProducts}>Volver a cargar</PrimaryButton>}
        />
      ) : null}

      {!loading && !error && featuredProducts.length > 0 ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-lg font-bold text-emerald-800">Destacados para tu contexto universitario</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {featuredProducts.map((product) => (
              <Link key={`featured-${product.id}`} href={`/app/tienda/${product.id}`} className="rounded-2xl border border-emerald-200 bg-white p-3 hover:bg-emerald-100">
                <p className="font-semibold">{product.title}</p>
                <p className="text-xs text-slate-600">{product.category?.name}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {!loading && !error && products.length === 0 ? (
          <PageState
            type="empty"
            title="No hay productos publicados"
            description="Vuelve pronto para revisar nuevos productos útiles para tu ciclo."
            action={<PrimaryButton type="button" onClick={loadProducts}>Reintentar</PrimaryButton>}
          />
        ) : (
          products.map((product) => (
            <article key={product.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              {product.isFeatured ? <span className="text-xs font-semibold text-emerald-700">Destacado</span> : null}
              <h2 className="text-lg font-bold">{product.title}</h2>
              <p className="mt-1 text-xs text-slate-500">{product.category?.name}</p>
              <p className="mt-2 text-sm text-slate-600 line-clamp-3">{product.description}</p>
              <p className="mt-3 font-semibold">S/ {product.price}</p>
              <Link href={`/app/tienda/${product.id}`} className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                Ver detalle
              </Link>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
