import type { BadgeProps } from "@/components/ui/badge";

type Tone = NonNullable<BadgeProps["tone"]>;

export function riskTone(risk: string): Tone {
  switch (risk) {
    case "low":
      return "live";
    case "medium":
      return "warn";
    case "high":
    case "critical":
      return "danger";
    default:
      return "neutral";
  }
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "active":
      return "live";
    case "pending":
      return "info";
    default:
      return "neutral";
  }
}

export function docStatusTone(status: string): Tone {
  switch (status) {
    case "valid":
      return "live";
    case "expiring":
      return "warn";
    case "expired":
      return "danger";
    default:
      return "neutral";
  }
}
