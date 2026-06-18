import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — AUDT",
  description: "AUDT platform documentation. AI-Native Trust, Risk & Compliance Platform.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
