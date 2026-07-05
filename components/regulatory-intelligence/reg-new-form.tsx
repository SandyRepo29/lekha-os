"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export type RegField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "date" | "number" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
};

type RegActionResult = { data?: unknown; error?: string };
type RegActionFn = (prev: unknown, fd: FormData) => Promise<RegActionResult>;

const inputCls =
  "w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]";

export function RegNewForm({
  action,
  fields,
  submitLabel,
  redirectTo,
}: {
  action: RegActionFn;
  fields: RegField[];
  submitLabel: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<RegActionResult | null, FormData>(action, null);

  useEffect(() => {
    if (state && !state.error && state.data) router.push(redirectTo);
  }, [state, redirectTo, router]);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className="mb-1.5 block text-xs font-medium">
            {f.label}{f.required && <span className="text-red-500"> *</span>}
          </label>
          {f.type === "textarea" ? (
            <textarea id={f.name} name={f.name} required={f.required} rows={3}
              placeholder={f.placeholder} defaultValue={f.defaultValue} className={inputCls} />
          ) : f.type === "select" ? (
            <select id={f.name} name={f.name} required={f.required} defaultValue={f.defaultValue ?? ""} className={inputCls}>
              {!f.required && <option value="">—</option>}
              {(f.options ?? []).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <input id={f.name} name={f.name} type={f.type ?? "text"} required={f.required}
              placeholder={f.placeholder} defaultValue={f.defaultValue} className={inputCls} />
          )}
        </div>
      ))}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}
