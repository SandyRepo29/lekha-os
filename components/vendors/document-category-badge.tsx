import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_CATEGORY_COLORS } from "@/lib/ai/gemini";
import { cn } from "@/lib/utils";

interface Props {
  category: string | null | undefined;
  size?: "xs" | "sm";
}

export function DocumentCategoryBadge({ category, size = "xs" }: Props) {
  if (!category) return null;
  const label = DOCUMENT_CATEGORY_LABELS[category] ?? "Other";
  const colors = DOCUMENT_CATEGORY_COLORS[category] ?? DOCUMENT_CATEGORY_COLORS.other;

  return (
    <span className={cn(
      "inline-flex items-center rounded-full border font-semibold",
      size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
      colors.text, colors.bg, colors.border
    )}>
      {label}
    </span>
  );
}
