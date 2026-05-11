export default async function UniversidadAgendaDiaPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  return <section><h1 className="text-2xl font-black">Agenda del día</h1><p className="text-sm text-slate-600">Fecha seleccionada: {date}</p></section>;
}
