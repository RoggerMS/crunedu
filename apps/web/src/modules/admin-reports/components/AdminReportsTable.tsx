import { AdminReport } from "../services/adminReportsApi";

type AdminReportsTableProps = {
  reports: AdminReport[];
  selectedIds: number[];
  actionLoadingId: number | null;
  bulkLoading: boolean;
  onSelect: (reportId: number) => void;
  onModerate: (reportId: number) => void;
  onModerateBulk: () => void;
  onOpenAudit: (reportId: number) => void;
};

export function AdminReportsTable({ reports, selectedIds, actionLoadingId, bulkLoading, onSelect, onModerate, onModerateBulk, onOpenAudit }: AdminReportsTableProps) {
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="mb-3 flex items-center gap-2">
        <button disabled={!selectedIds.length || bulkLoading} onClick={onModerateBulk} className="rounded-lg border border-indigo-300 px-3 py-2 text-indigo-700 disabled:opacity-60">
          Resolver seleccionados ({selectedIds.length})
        </button>
      </div>
      <table className="min-w-full text-left text-sm">
        <thead><tr className="border-b border-slate-200"><th className="px-2 py-2">Sel.</th><th className="px-2 py-2">ID</th><th className="px-2 py-2">Objetivo</th><th className="px-2 py-2">Motivo</th><th className="px-2 py-2">Gravedad</th><th className="px-2 py-2">SLA</th><th className="px-2 py-2">Estado</th><th className="px-2 py-2">Acciones</th></tr></thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className="border-b border-slate-100">
              <td className="px-2 py-2"><input type="checkbox" checked={selectedIds.includes(report.id)} onChange={() => onSelect(report.id)} /></td>
              <td className="px-2 py-2">{report.id}</td>
              <td className="px-2 py-2">{report.post ? `Post #${report.post.id}` : `Comentario #${report.comment?.id ?? "-"}`}</td>
              <td className="px-2 py-2">{report.reason}</td>
              <td className="px-2 py-2 uppercase">{report.severity}</td>
              <td className="px-2 py-2">{report.slaTargetHours}h</td>
              <td className="px-2 py-2">{report.status}</td>
              <td className="px-2 py-2"><div className="flex gap-2"><button disabled={actionLoadingId === report.id} onClick={() => onModerate(report.id)} className="rounded-lg border border-red-300 px-2 py-1 text-red-700">Resolver</button><button onClick={() => onOpenAudit(report.id)} className="rounded-lg border border-slate-300 px-2 py-1">Historial</button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
