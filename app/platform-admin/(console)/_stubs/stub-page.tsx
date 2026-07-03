// Shared stub for pages not yet fully built
import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { Construction } from "lucide-react";

export async function StubPage({ title, description }: { title: string; description: string }) {
  await requirePlatformUser();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="mt-0.5 text-sm text-white/40">{description}</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#30363d] bg-white/[0.01] py-16 text-center">
        <Construction className="mb-3 h-10 w-10 text-white/20" />
        <div className="text-sm font-medium text-white/40">Coming soon</div>
        <div className="mt-1 text-[12px] text-white/20">This section is under construction.</div>
      </div>
    </div>
  );
}
