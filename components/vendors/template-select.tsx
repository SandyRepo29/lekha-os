import { Select, SelectOption } from "@/components/ui/select";
import { Label } from "@/components/ui/input";
import { listTemplates } from "@/lib/services/template-service";

export async function TemplateSelect({ orgId, currentId }: { orgId: string; currentId?: string | null }) {
  const templates = await listTemplates(orgId);

  return (
    <div>
      <Label htmlFor="vendorTypeId">Vendor type template</Label>
      <Select id="vendorTypeId" name="vendorTypeId" defaultValue={currentId ?? ""}>
        <SelectOption value="">No template</SelectOption>
        {templates.map((t) => (
          <SelectOption key={t.id} value={t.id}>{t.name}</SelectOption>
        ))}
      </Select>
      <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
        Templates define the required compliance documents for this vendor type.
      </p>
    </div>
  );
}
