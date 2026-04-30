import { AdminReport, ModerationAction } from "../services/adminReportsApi";

type AdminReportsTableProps = {
  reports: AdminReport[];
  actionLoadingId: number | null;
  onModerate: (reportId: number, action: ModerationAction) => void;
};

export function AdminReportsTable({
  reports,
  actionLoadingId,
  onModerate,
}: AdminReportsTableProps) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-2 py-2">ID</th>
            <th className="px-2 py-2">Objetivo</th>
            <th className="px-2 py-2">Motivo</th>
            <th className="px-2 py-2">Estado</th>
            <th className="px-2 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className="border-b border-slate-100">
              <td className="px-2 py-2">{report.id}</td>
              <td className="px-2 py-2">
                {report.post
                  ? `Post #${report.post.id}`
                  : `Comentario #${report.comment?.id ?? "-"}`}
              </td>
              <td className="px-2 py-2">{report.reason}</td>
              <td className="px-2 py-2">{report.status}</td>
              <td className="px-2 py-2">
                <div className="flex gap-2">
                  <button
                    disabled={actionLoadingId === report.id}
                    onClick={() => onModerate(report.id, "hide")}
                    className="rounded-lg border border-red-300 px-2 py-1 text-red-700"
                  >
                    Ocultar
                  </button>
                  <button
                    disabled={actionLoadingId === report.id}
                    onClick={() => onModerate(report.id, "restore")}
                    className="rounded-lg border border-emerald-300 px-2 py-1 text-emerald-700"
                  >
                    Restaurar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
