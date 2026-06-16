"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrganization } from "@/lib/orgs/actions";
import { inviteTeamMembersOnboarding, type OnboardingInvite } from "@/lib/orgs/onboarding-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GoalKey =
  | "vendor_risk"
  | "soc2"
  | "dpdp"
  | "audit"
  | "ai_governance"
  | "executive_reporting";

interface GoalCard {
  key: GoalKey;
  icon: string;
  title: string;
  description: string;
}

const GOALS: GoalCard[] = [
  {
    key: "vendor_risk",
    icon: "🏢",
    title: "Vendor Risk Management",
    description: "Assess, score and monitor your supplier ecosystem",
  },
  {
    key: "soc2",
    icon: "🔒",
    title: "SOC 2 / ISO 27001 Compliance",
    description: "Map controls, collect evidence, close gaps",
  },
  {
    key: "dpdp",
    icon: "🇮🇳",
    title: "DPDP / Privacy Compliance",
    description: "India DPDP Act 2023, consent, data assets",
  },
  {
    key: "audit",
    icon: "📋",
    title: "Audit Management",
    description: "Plan audits, track findings, manage CAPAs",
  },
  {
    key: "ai_governance",
    icon: "🤖",
    title: "AI Governance",
    description: "Govern AI systems, risks and responsible AI frameworks",
  },
  {
    key: "executive_reporting",
    icon: "📊",
    title: "Board & Executive Reporting",
    description: "Executive dashboards, KPIs, board reports",
  },
];

const INDUSTRIES: { label: string; value: string }[] = [
  { label: "Technology", value: "saas" },
  { label: "Financial Services", value: "fintech" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Manufacturing", value: "manufacturing" },
  { label: "Professional Services", value: "it_services" },
  { label: "E-commerce", value: "saas" },
  { label: "Education", value: "education" },
  { label: "Other", value: "other" },
];

const COMPANY_SIZES: { label: string; value: string }[] = [
  { label: "1–50", value: "1_10" },
  { label: "51–200", value: "51_200" },
  { label: "201–1000", value: "201_500" },
  { label: "1000+", value: "1000_plus" },
];

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "compliance_manager", label: "Compliance Manager" },
  { value: "security_manager", label: "Security Manager" },
  { value: "viewer", label: "Viewer" },
];

const EMPTY_INVITE: OnboardingInvite = { name: "", email: "", role: "admin" };

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => {
        const stepNum = i + 1;
        const active = stepNum === current;
        const done = stepNum < current;
        return (
          <div
            key={i}
            className={[
              "h-2 rounded-full transition-all duration-300",
              active ? "w-8 bg-[var(--color-blue)]" : done ? "w-2 bg-[var(--color-blue)]/60" : "w-2 bg-white/[0.12]",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Select helper (styled to match app)
// ---------------------------------------------------------------------------

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0f0f1a]">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------

export function OnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 fields
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [step1Error, setStep1Error] = useState("");

  // Step 2 fields
  const [goals, setGoals] = useState<GoalKey[]>([]);
  const [step2Error, setStep2Error] = useState("");

  // Step 3 fields
  const [invites, setInvites] = useState<OnboardingInvite[]>([{ ...EMPTY_INVITE }]);
  const [submitError, setSubmitError] = useState("");

  // -------------------------------------------------------------------------
  // Step 1 — advance
  // -------------------------------------------------------------------------
  function handleStep1Next() {
    if (orgName.trim().length < 2) {
      setStep1Error("Please enter your organization name (at least 2 characters).");
      return;
    }
    setStep1Error("");
    setStep(2);
  }

  // -------------------------------------------------------------------------
  // Step 2 — toggle goal
  // -------------------------------------------------------------------------
  function toggleGoal(key: GoalKey) {
    setGoals((prev) =>
      prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]
    );
  }

  function handleStep2Next() {
    if (goals.length === 0) {
      setStep2Error("Please select at least one goal to continue.");
      return;
    }
    setStep2Error("");
    setStep(3);
  }

  // -------------------------------------------------------------------------
  // Step 3 — invite rows
  // -------------------------------------------------------------------------
  function updateInvite(idx: number, field: keyof OnboardingInvite, value: string) {
    setInvites((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function addInviteRow() {
    if (invites.length < 4) setInvites((prev) => [...prev, { ...EMPTY_INVITE }]);
  }

  // -------------------------------------------------------------------------
  // Final submit
  // -------------------------------------------------------------------------
  function handleSubmit(skipInvites: boolean) {
    setSubmitError("");
    startTransition(async () => {
      // 1. Create org
      const fd = new FormData();
      fd.append("name", orgName);
      fd.append("industry", industry);
      fd.append("companySize", companySize);
      const result = await createOrganization(undefined, fd);
      if (result?.error) {
        setSubmitError(result.error);
        return;
      }

      // 2. Persist goals to localStorage
      try {
        localStorage.setItem("audt_onboarding_goals", JSON.stringify(goals));
      } catch {
        // localStorage not available in some environments — non-fatal
      }

      // 3. Optionally send invites
      if (!skipInvites) {
        const validInvites = invites.filter((i) => i.email.trim().length > 0);
        if (validInvites.length > 0) {
          const inviteResult = await inviteTeamMembersOnboarding(validInvites);
          if (inviteResult?.error) {
            // Non-fatal — org already created; warn but proceed
            console.warn("Some invites failed:", inviteResult.error);
          }
        }
      }

      // 4. Redirect
      router.push("/dashboard?welcome=1");
    });
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-7 shadow-xl backdrop-blur-sm">
      <StepIndicator current={step} total={3} />

      {/* ------------------------------------------------------------------ */}
      {/* STEP 1 — Workspace                                                   */}
      {/* ------------------------------------------------------------------ */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
              Create your workspace
            </h1>
            <p className="mt-1.5 text-sm text-[var(--color-ink-dim)]">
              Tell us about your organization so we can tailor AUDT for you.
            </p>
          </div>

          <div>
            <Label htmlFor="name">Organization name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="Acme Technologies Pvt Ltd"
              autoComplete="organization"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStep1Next()}
            />
          </div>

          <SelectField
            id="industry"
            label="Industry"
            value={industry}
            onChange={setIndustry}
            options={INDUSTRIES}
            placeholder="Select your industry"
          />

          <SelectField
            id="companySize"
            label="Company size"
            value={companySize}
            onChange={setCompanySize}
            options={COMPANY_SIZES}
            placeholder="Select company size"
          />

          {step1Error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {step1Error}
            </p>
          )}

          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleStep1Next}
          >
            Continue →
          </Button>

          <p className="text-center text-xs text-[var(--color-ink-faint)]">
            You&apos;ll be the owner of this workspace.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STEP 2 — Goals                                                        */}
      {/* ------------------------------------------------------------------ */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
              What are you here to govern?
            </h1>
            <p className="mt-1.5 text-sm text-[var(--color-ink-dim)]">
              We&apos;ll prioritize the right modules for your team.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {GOALS.map((goal) => {
              const selected = goals.includes(goal.key);
              return (
                <button
                  key={goal.key}
                  type="button"
                  onClick={() => toggleGoal(goal.key)}
                  className={[
                    "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-150",
                    selected
                      ? "border-[var(--color-blue)] bg-[var(--color-blue)]/10"
                      : "border-[var(--color-line)] bg-white/[0.02] hover:border-[var(--color-blue)]/50 hover:bg-white/[0.04]",
                  ].join(" ")}
                >
                  <span className="mt-0.5 text-xl leading-none">{goal.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {goal.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">
                      {goal.description}
                    </p>
                  </div>
                  {selected && (
                    <span className="ml-auto shrink-0 text-[var(--color-blue)]">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {step2Error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {step2Error}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => setStep(1)}
            >
              ← Back
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handleStep2Next}
            >
              Continue →
            </Button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STEP 3 — Invite team                                                  */}
      {/* ------------------------------------------------------------------ */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
              Invite your team
            </h1>
            <p className="mt-1.5 text-sm text-[var(--color-ink-dim)]">
              You can always do this later.
            </p>
          </div>

          <div className="space-y-3">
            {invites.map((invite, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-3"
              >
                <Input
                  placeholder="Name"
                  value={invite.name}
                  onChange={(e) => updateInvite(idx, "name", e.target.value)}
                  aria-label="Invite name"
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={invite.email}
                  onChange={(e) => updateInvite(idx, "email", e.target.value)}
                  aria-label="Invite email"
                />
                <select
                  value={invite.role}
                  onChange={(e) =>
                    updateInvite(idx, "role", e.target.value as OnboardingInvite["role"])
                  }
                  aria-label="Invite role"
                  className="rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-2 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value} className="bg-[#0f0f1a]">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {invites.length < 4 && (
              <button
                type="button"
                onClick={addInviteRow}
                className="text-sm text-[var(--color-blue)] hover:underline"
              >
                + Add another
              </button>
            )}
          </div>

          {submitError && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {submitError}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => setStep(2)}
              disabled={isPending}
            >
              ← Back
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={() => handleSubmit(false)}
              disabled={isPending}
            >
              {isPending ? "Setting up…" : "Finish setup →"}
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isPending}
              className="text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:underline disabled:opacity-50"
            >
              Skip for now →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
