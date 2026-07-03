export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { LayoutTemplate } from "lucide-react";

async function getTemplates() {
  try {
    const [types, frameworks] = await Promise.all([
      db.execute(sql`
        SELECT vt.id, vt.name, vt.description, vt.is_custom,
               COUNT(vtd.id) as doc_count
        FROM vendor_types vt
        LEFT JOIN vendor_type_documents vtd ON vtd.vendor_type_id = vt.id
        GROUP BY vt.id, vt.name, vt.description, vt.is_custom
        ORDER BY vt.is_custom, vt.name
      `),
      db.execute(sql`
        SELECT f.id, f.name, f.status, COUNT(c.id) as control_count
        FROM frameworks f
        LEFT JOIN controls c ON c.framework_id = f.id
        WHERE f.organization_id IS NULL OR f.status = 'active'
        GROUP BY f.id, f.name, f.status
        ORDER BY f.name
        LIMIT 10
      `).catch(() => []),
    ]);
    return { types: types as Array<Record<string, unknown>>, frameworks: frameworks as Array<Record<string, unknown>> };
  } catch { return { types: [], frameworks: [] }; }
}

export default async function TemplatesPage() {
  await requirePlatformUser();
  const { types, frameworks } = await getTemplates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">System Templates</h1>
        <p className="mt-0.5 text-sm text-white/40">Vendor compliance templates and compliance framework defaults.</p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <LayoutTemplate className="h-4 w-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white">Vendor Type Templates ({types.length})</h2>
        </div>
        <div className="rounded-xl border border-[#30363d] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363d] bg-white/[0.02]">
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Template Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Type</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Required Docs</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {types.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-white/30">No templates found.</td></tr>
              ) : types.map((t) => (
                <tr key={t.id as string} className="hover:bg-white/[0.015] transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-white">{t.name as string}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${t.is_custom ? "bg-amber-500/20 text-amber-300" : "bg-[#00B8D9]/20 text-[#00B8D9]"}`}>
                      {t.is_custom ? "Custom" : "Global"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-white/60">{String(t.doc_count ?? 0)} docs</td>
                  <td className="px-5 py-3 text-xs text-white/30 max-w-xs truncate">{(t.description as string) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {frameworks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Compliance Frameworks (sample)</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {frameworks.map((f) => (
              <div key={f.id as string} className="rounded-xl border border-[#30363d] bg-white/[0.02] p-4">
                <div className="text-sm font-medium text-white">{f.name as string}</div>
                <div className="mt-1 text-xs text-white/40">{String(f.control_count ?? 0)} controls</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
