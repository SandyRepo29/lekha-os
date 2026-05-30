import { Input, Label } from "@/components/ui/input";
import { UserCircle } from "lucide-react";

type Props = {
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerDepartment?: string | null;
};

export function OwnerFields({ ownerName, ownerEmail, ownerDepartment }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <UserCircle className="h-4 w-4 text-[var(--color-ink-faint)]" />
        <span className="text-sm font-semibold text-[var(--color-ink)]">Internal owner</span>
        <span className="text-xs text-[var(--color-ink-faint)]">— who is accountable for this vendor?</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="ownerName">Owner name</Label>
          <Input id="ownerName" name="ownerName" defaultValue={ownerName ?? ""} placeholder="Priya Singh" />
        </div>
        <div>
          <Label htmlFor="ownerEmail">Owner email</Label>
          <Input id="ownerEmail" name="ownerEmail" type="email" defaultValue={ownerEmail ?? ""} placeholder="priya@company.com" />
        </div>
        <div>
          <Label htmlFor="ownerDepartment">Department</Label>
          <Input id="ownerDepartment" name="ownerDepartment" defaultValue={ownerDepartment ?? ""} placeholder="IT / Procurement / Legal" />
        </div>
      </div>
    </div>
  );
}
