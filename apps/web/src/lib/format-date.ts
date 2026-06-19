export function formatRelativeDate(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const seconds = Math.round(diffMs / 1000);
  if (seconds < 60) return "hace un momento";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `hace ${days} d`;
  if (days < 30) return `hace ${Math.round(days / 7)} sem`;
  const months = Math.round(days / 30);
  if (months < 12) return `hace ${months} mes(es)`;
  return `hace ${Math.round(months / 12)} año(s)`;
}

export function formatFullDate(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}
