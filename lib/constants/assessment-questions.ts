export type AssessmentQuestion = {
  key: string;
  category: string;
  question: string;
  weight: number; // 1-3, higher = more important to the score
};

export const STANDARD_QUESTIONS: AssessmentQuestion[] = [
  // Security Controls
  { key: "sec_mfa", category: "Access Management", question: "Is multi-factor authentication enforced for all privileged accounts?", weight: 3 },
  { key: "sec_rbac", category: "Access Management", question: "Is role-based access control (RBAC) implemented and regularly reviewed?", weight: 2 },
  { key: "sec_offboard", category: "Access Management", question: "Is there a formal offboarding process to revoke access immediately on termination?", weight: 3 },

  // Encryption
  { key: "enc_transit", category: "Encryption", question: "Is all data encrypted in transit using TLS 1.2 or higher?", weight: 3 },
  { key: "enc_rest", category: "Encryption", question: "Is all sensitive data encrypted at rest?", weight: 3 },
  { key: "enc_keys", category: "Encryption", question: "Are encryption keys managed using a dedicated key management service?", weight: 2 },

  // Incident Response
  { key: "ir_plan", category: "Incident Response", question: "Is there a documented incident response plan?", weight: 3 },
  { key: "ir_tested", category: "Incident Response", question: "Is the incident response plan tested at least annually?", weight: 2 },
  { key: "ir_notify", category: "Incident Response", question: "Are there defined SLAs for notifying customers of security incidents?", weight: 3 },

  // Backup & Recovery
  { key: "bc_backup", category: "Backup & Recovery", question: "Are backups performed regularly and stored securely?", weight: 2 },
  { key: "bc_test", category: "Backup & Recovery", question: "Are backup restoration tests conducted periodically?", weight: 2 },
  { key: "bc_bcp", category: "Backup & Recovery", question: "Is there a Business Continuity Plan (BCP) in place?", weight: 2 },

  // Vulnerability Management
  { key: "vm_scan", category: "Vulnerability Management", question: "Are regular vulnerability scans and penetration tests conducted?", weight: 3 },
  { key: "vm_patch", category: "Vulnerability Management", question: "Is there a defined patch management process with SLA timelines?", weight: 2 },

  // Data Protection
  { key: "dp_inventory", category: "Data Protection", question: "Is a data inventory maintained for all personal data processed?", weight: 2 },
  { key: "dp_dpa", category: "Data Protection", question: "Is a Data Processing Agreement (DPA) signed with all sub-processors?", weight: 3 },
  { key: "dp_retention", category: "Data Protection", question: "Are data retention and deletion policies defined and enforced?", weight: 2 },
];

export function groupByCategory(questions: AssessmentQuestion[]) {
  const map = new Map<string, AssessmentQuestion[]>();
  for (const q of questions) {
    if (!map.has(q.category)) map.set(q.category, []);
    map.get(q.category)!.push(q);
  }
  return map;
}

export function calculateScore(responses: Map<string, string>): number {
  const ANSWER_WEIGHTS: Record<string, number> = { yes: 1, partial: 0.5, no: 0, na: 1 };
  let totalWeight = 0; let earnedWeight = 0;
  for (const q of STANDARD_QUESTIONS) {
    const answer = responses.get(q.key) ?? "no";
    if (answer === "na") continue;
    totalWeight += q.weight;
    earnedWeight += q.weight * (ANSWER_WEIGHTS[answer] ?? 0);
  }
  return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
}
