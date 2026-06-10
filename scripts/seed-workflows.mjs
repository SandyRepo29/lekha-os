import postgres from "postgres";
import { config } from "dotenv";
import { randomUUID } from "crypto";
config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });
const log  = (msg) => console.log(`  ${msg}`);
const head = (msg) => console.log(`\n▶ ${msg}`);

const targetId = process.argv[2] ?? null;
const orgs = targetId
  ? await sql`select id, name from organizations where id = ${targetId}`
  : await sql`select id, name from organizations where name = 'admin corp' order by created_at limit 1`;
if (!orgs.length) { console.error("No org found."); await sql.end(); process.exit(1); }
const { id: orgId, name: orgName } = orgs[0];
log(`Org: ${orgName} (${orgId})`);

const [owner] = await sql`select user_id from memberships where organization_id = ${orgId} and role = 'owner' limit 1`;
const ownerId = owner?.user_id ?? null;
log(`Owner: ${ownerId ?? "none"}`);

// Helper: days offset from now
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n) => new Date(Date.now() + n * 86400000).toISOString();
const hoursAgo = (n) => new Date(Date.now() - n * 3600000).toISOString();

// ─────────────────────────────────────────────
// WORKFLOW DEFINITIONS
// ─────────────────────────────────────────────

const workflowDefs = [
  {
    name: "Vendor Onboarding Approval",
    description: "Automated approval workflow triggered when a new vendor is created. Routes through document review, manager approval, and onboarding notification.",
    module: "vendor_hub",
    status: "active",
    trigger_type: "record_created",
    trigger_config: { entity_type: "vendor", conditions: [] },
    nodes: [
      { key: "trigger",      node_type: "start",        label: "Vendor Created",         position_x: 100,  position_y: 200, config: { entity_type: "vendor" } },
      { key: "review_docs",  node_type: "task",         label: "Review Vendor Documents", position_x: 300,  position_y: 200, config: { assignee_role: "procurement_manager", instructions: "Verify all required vendor documents are present and valid." } },
      { key: "approval",     node_type: "approval",     label: "Manager Approval",        position_x: 500,  position_y: 200, config: { approver_role: "admin", timeout_days: 3, on_timeout: "escalate" } },
      { key: "notify",       node_type: "notification", label: "Notify Stakeholders",     position_x: 700,  position_y: 200, config: { channels: ["email"], template: "vendor_onboarded", recipients: ["procurement_manager", "owner"] } },
      { key: "end",          node_type: "end",          label: "Onboarding Complete",     position_x: 900,  position_y: 200, config: {} },
    ],
    transitions: [
      { from: "trigger",     to: "review_docs", label: "Start Review" },
      { from: "review_docs", to: "approval",    label: "Docs Verified" },
      { from: "approval",    to: "notify",      label: "Approved" },
      { from: "approval",    to: "end",         label: "Rejected", condition_expr: "approval.status == 'rejected'" },
      { from: "notify",      to: "end",         label: "Done" },
    ],
  },
  {
    name: "DPDP Privacy Request Handler",
    description: "Handles incoming Data Subject Requests under India DPDP Act 2023. Validates, assigns to DPO, executes the request, and notifies the data subject.",
    module: "dpdp_privacy",
    status: "active",
    trigger_type: "record_created",
    trigger_config: { entity_type: "privacy_request", conditions: [] },
    nodes: [
      { key: "trigger",  node_type: "start",        label: "Privacy Request Received",  position_x: 100,  position_y: 200, config: { entity_type: "privacy_request" } },
      { key: "validate", node_type: "condition",    label: "Validate Request",           position_x: 300,  position_y: 200, config: { checks: ["identity_verified", "request_type_valid"] } },
      { key: "assign",   node_type: "task",         label: "Assign to DPO",              position_x: 500,  position_y: 200, config: { assignee_role: "compliance_manager", sla_days: 7, instructions: "Review and acknowledge the data subject request within 72 hours." } },
      { key: "action",   node_type: "update_record",label: "Execute Request Action",     position_x: 700,  position_y: 200, config: { entity_type: "privacy_request", updates: { status: "completed" } } },
      { key: "notify",   node_type: "notification", label: "Notify Data Subject",        position_x: 900,  position_y: 200, config: { channels: ["email"], template: "dsr_completed", recipients: ["requester"] } },
      { key: "end",      node_type: "end",          label: "Request Closed",             position_x: 1100, position_y: 200, config: {} },
    ],
    transitions: [
      { from: "trigger",  to: "validate", label: "New Request" },
      { from: "validate", to: "assign",   label: "Valid", condition_expr: "validation.passed == true" },
      { from: "validate", to: "end",      label: "Invalid — Reject", condition_expr: "validation.passed == false" },
      { from: "assign",   to: "action",   label: "DPO Assigned" },
      { from: "action",   to: "notify",   label: "Action Complete" },
      { from: "notify",   to: "end",      label: "Done" },
    ],
  },
  {
    name: "Critical Risk Escalation",
    description: "Triggered when a risk score crosses the critical threshold. Evaluates severity, notifies the risk owner, seeks executive approval, and escalates to board if unresolved.",
    module: "risk_lens",
    status: "active",
    trigger_type: "score_threshold",
    trigger_config: { entity_type: "risk", threshold: 80, field: "inherent_score" },
    nodes: [
      { key: "trigger",       node_type: "start",        label: "Risk Score Threshold Breached", position_x: 100,  position_y: 200, config: { entity_type: "risk", threshold: 80 } },
      { key: "condition",     node_type: "condition",    label: "Check Severity",                position_x: 300,  position_y: 200, config: { field: "inherent_score", operator: "gte", value: 80 } },
      { key: "notify_owner",  node_type: "notification", label: "Notify Risk Owner",             position_x: 500,  position_y: 200, config: { channels: ["email", "in_app"], template: "critical_risk_alert", recipients: ["risk_owner"] } },
      { key: "approval",      node_type: "approval",     label: "Executive Acknowledgement",     position_x: 700,  position_y: 200, config: { approver_role: "admin", timeout_days: 2, on_timeout: "escalate" } },
      { key: "escalate",      node_type: "notification", label: "Escalate to Board",             position_x: 900,  position_y: 200, config: { channels: ["email"], template: "board_escalation", recipients: ["owner"] } },
      { key: "end",           node_type: "end",          label: "Escalation Complete",           position_x: 1100, position_y: 200, config: {} },
    ],
    transitions: [
      { from: "trigger",      to: "condition",    label: "Evaluate" },
      { from: "condition",    to: "notify_owner", label: "Critical", condition_expr: "risk.inherent_score >= 80" },
      { from: "condition",    to: "end",          label: "Below Threshold", condition_expr: "risk.inherent_score < 80" },
      { from: "notify_owner", to: "approval",     label: "Owner Notified" },
      { from: "approval",     to: "end",          label: "Acknowledged" },
      { from: "approval",     to: "escalate",     label: "Timeout / Unacknowledged", condition_expr: "approval.timed_out == true" },
      { from: "escalate",     to: "end",          label: "Board Notified" },
    ],
  },
  {
    name: "Contract Renewal Reminder",
    description: "Scheduled workflow that checks for contracts expiring within 60 days, sends renewal reminders, and creates follow-up tasks for the contracts team.",
    module: "contract_governance",
    status: "active",
    trigger_type: "scheduled",
    trigger_config: { cron: "0 9 * * 1", timezone: "Asia/Kolkata", description: "Every Monday 9am IST" },
    nodes: [
      { key: "trigger",      node_type: "start",         label: "Scheduled Trigger",       position_x: 100,  position_y: 200, config: { cron: "0 9 * * 1" } },
      { key: "check_expiry", node_type: "condition",     label: "Check Expiring Contracts", position_x: 300,  position_y: 200, config: { query: "contracts", filter: { days_to_expiry_lte: 60, status: "active" } } },
      { key: "notify",       node_type: "notification",  label: "Send Renewal Reminder",   position_x: 500,  position_y: 200, config: { channels: ["email"], template: "contract_renewal_reminder", recipients: ["contract_owner", "procurement_manager"] } },
      { key: "create_task",  node_type: "create_record", label: "Create Renewal Task",     position_x: 700,  position_y: 200, config: { entity_type: "issue_task", fields: { title: "Review contract renewal", priority: "high" } } },
      { key: "end",          node_type: "end",           label: "Reminders Sent",          position_x: 900,  position_y: 200, config: {} },
    ],
    transitions: [
      { from: "trigger",      to: "check_expiry", label: "Run Check" },
      { from: "check_expiry", to: "notify",       label: "Expiring Contracts Found", condition_expr: "contracts.expiring_count > 0" },
      { from: "check_expiry", to: "end",          label: "Nothing Expiring", condition_expr: "contracts.expiring_count == 0" },
      { from: "notify",       to: "create_task",  label: "Reminder Sent" },
      { from: "create_task",  to: "end",          label: "Task Created" },
    ],
  },
  {
    name: "Issue SLA Breach Response",
    description: "Draft workflow triggered when an issue breaches its SLA. Notifies assigned team and auto-escalates. Work in progress.",
    module: "issue_hub",
    status: "draft",
    trigger_type: "score_threshold",
    trigger_config: { entity_type: "issue", field: "sla_breached", operator: "eq", value: true },
    nodes: [
      { key: "trigger",  node_type: "start",        label: "SLA Breach Detected",    position_x: 100, position_y: 200, config: { entity_type: "issue" } },
      { key: "notify",   node_type: "notification", label: "Notify Assigned Owner",  position_x: 300, position_y: 200, config: { channels: ["email", "in_app"], template: "sla_breach_alert", recipients: ["issue_owner"] } },
      { key: "end",      node_type: "end",          label: "Escalation Triggered",   position_x: 500, position_y: 200, config: {} },
    ],
    transitions: [
      { from: "trigger", to: "notify", label: "Breach Detected" },
      { from: "notify",  to: "end",    label: "Done" },
    ],
  },
];

// ─────────────────────────────────────────────
// RUNS PER ACTIVE WORKFLOW
// ─────────────────────────────────────────────
// Each entry: { workflowKey (by name index 0-4), status, daysAgoStarted, hasApproval }
const runSpecs = {
  0: [ // Vendor Onboarding Approval
    { status: "completed",  startedDaysAgo: 10, completedDaysAgo: 9,  triggerEntityType: "vendor", context: { vendor_name: "Infosys Ltd", action: "onboarding" } },
    { status: "completed",  startedDaysAgo: 6,  completedDaysAgo: 5,  triggerEntityType: "vendor", context: { vendor_name: "TCS Mumbai", action: "onboarding" } },
    { status: "waiting",    startedDaysAgo: 1,  completedDaysAgo: null, triggerEntityType: "vendor", context: { vendor_name: "Wipro Digital", action: "onboarding" }, hasApproval: true },
    { status: "failed",     startedDaysAgo: 4,  completedDaysAgo: 3,  triggerEntityType: "vendor", context: { vendor_name: "HCL Tech", action: "onboarding" }, failedReason: "Document validation timeout after 72h" },
  ],
  1: [ // DPDP Privacy Request Handler
    { status: "completed",  startedDaysAgo: 8,  completedDaysAgo: 7,  triggerEntityType: "privacy_request", context: { request_type: "data_access", subject: "user@example.com" } },
    { status: "completed",  startedDaysAgo: 5,  completedDaysAgo: 4,  triggerEntityType: "privacy_request", context: { request_type: "erasure", subject: "test@domain.in" } },
    { status: "running",    startedDaysAgo: 0,  completedDaysAgo: null, triggerEntityType: "privacy_request", context: { request_type: "data_portability", subject: "customer@fintech.co" } },
    { status: "failed",     startedDaysAgo: 3,  completedDaysAgo: 3,  triggerEntityType: "privacy_request", context: { request_type: "correction", subject: "anon_user@example.com" }, failedReason: "Identity verification failed — no matching records" },
    { status: "waiting",    startedDaysAgo: 1,  completedDaysAgo: null, triggerEntityType: "privacy_request", context: { request_type: "data_access", subject: "req_002@healthco.in" }, hasApproval: true },
  ],
  2: [ // Critical Risk Escalation
    { status: "completed",  startedDaysAgo: 12, completedDaysAgo: 11, triggerEntityType: "risk", context: { risk_title: "Third-party API outage risk", score: 82 } },
    { status: "completed",  startedDaysAgo: 7,  completedDaysAgo: 7,  triggerEntityType: "risk", context: { risk_title: "Data localisation non-compliance", score: 88 } },
    { status: "waiting",    startedDaysAgo: 2,  completedDaysAgo: null, triggerEntityType: "risk", context: { risk_title: "Critical vendor concentration risk", score: 91 }, hasApproval: true },
    { status: "failed",     startedDaysAgo: 9,  completedDaysAgo: 8,  triggerEntityType: "risk", context: { risk_title: "Ransomware exposure — legacy infra", score: 95 }, failedReason: "Notification delivery failed — invalid owner email" },
  ],
};

// ─────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────

head("Seeding Workflow Studio™");

const insertedWorkflows = [];

for (let i = 0; i < workflowDefs.length; i++) {
  const def = workflowDefs[i];

  // Idempotency check
  const [existing] = await sql`
    select id from workflows
    where organization_id = ${orgId} and name = ${def.name}
    limit 1
  `;
  if (existing) {
    log(`SKIP (exists): ${def.name}`);
    insertedWorkflows.push({ id: existing.id, nodes: {}, def });
    continue;
  }

  // Insert workflow
  const wfId = randomUUID();
  const publishedAt = def.status === "active" ? daysAgo(30) : null;
  await sql`
    insert into workflows (
      id, organization_id, name, description, module, status,
      version, is_template, trigger_type, trigger_config,
      created_by, published_at, created_at, updated_at
    ) values (
      ${wfId}, ${orgId}, ${def.name}, ${def.description}, ${def.module}, ${def.status},
      1, false, ${def.trigger_type}, ${JSON.stringify(def.trigger_config)},
      ${ownerId}, ${publishedAt}, ${daysAgo(30)}, ${daysAgo(1)}
    )
  `;

  // Insert nodes
  const nodeIdMap = {}; // key -> uuid
  for (const n of def.nodes) {
    const nId = randomUUID();
    nodeIdMap[n.key] = nId;
    await sql`
      insert into workflow_nodes (
        id, workflow_id, organization_id, node_type, label, description,
        position_x, position_y, config, created_at
      ) values (
        ${nId}, ${wfId}, ${orgId}, ${n.node_type}, ${n.label}, ${n.description ?? null},
        ${n.position_x}, ${n.position_y}, ${JSON.stringify(n.config)}, ${daysAgo(30)}
      )
    `;
  }

  // Insert transitions
  for (const t of def.transitions) {
    await sql`
      insert into workflow_transitions (
        id, workflow_id, organization_id, from_node_id, to_node_id,
        label, condition_expr, created_at
      ) values (
        ${randomUUID()}, ${wfId}, ${orgId},
        ${nodeIdMap[t.from]}, ${nodeIdMap[t.to]},
        ${t.label ?? null}, ${t.condition_expr ?? null}, ${daysAgo(30)}
      )
    `;
  }

  log(`CREATE workflow: ${def.name} (${def.nodes.length} nodes, ${def.transitions.length} transitions)`);
  insertedWorkflows.push({ id: wfId, nodes: nodeIdMap, def });
}

// ─────────────────────────────────────────────
// RUNS + APPROVALS
// ─────────────────────────────────────────────

head("Seeding workflow runs");

for (const [wfIdx, runs] of Object.entries(runSpecs)) {
  const wf = insertedWorkflows[parseInt(wfIdx)];
  if (!wf) continue;

  // Skip if runs already exist for this workflow
  const [existingRun] = await sql`
    select id from workflow_runs
    where workflow_id = ${wf.id} and organization_id = ${orgId}
    limit 1
  `;
  if (existingRun) {
    log(`SKIP runs (exist): ${wf.def.name}`);
    continue;
  }

  for (const run of runs) {
    const runId = randomUUID();
    const startedAt = daysAgo(run.startedDaysAgo);
    const completedAt = run.completedDaysAgo != null ? daysAgo(run.completedDaysAgo) : null;
    const triggerEntityId = randomUUID();

    // Find a suitable current node for waiting/running runs
    let currentNodeId = null;
    if (wf.nodes && Object.keys(wf.nodes).length > 0) {
      const nodeKeys = Object.keys(wf.nodes);
      if (run.status === "waiting" && run.hasApproval) {
        // Use the approval node as current
        const approvalKey = nodeKeys.find((k) => wf.def.nodes.find((n) => n.key === k && n.node_type === "approval"));
        currentNodeId = approvalKey ? wf.nodes[approvalKey] : wf.nodes[nodeKeys[Math.floor(nodeKeys.length / 2)]];
      } else if (run.status === "running") {
        const taskKey = nodeKeys.find((k) => wf.def.nodes.find((n) => n.key === k && (n.node_type === "task" || n.node_type === "condition")));
        currentNodeId = taskKey ? wf.nodes[taskKey] : wf.nodes[nodeKeys[1]];
      }
    }

    await sql`
      insert into workflow_runs (
        id, workflow_id, organization_id, status, trigger_type,
        trigger_entity_id, trigger_entity_type, current_node_id,
        started_by, started_at, completed_at, failed_reason,
        context_data, created_at, updated_at
      ) values (
        ${runId}, ${wf.id}, ${orgId}, ${run.status}, ${wf.def.trigger_type},
        ${triggerEntityId}, ${run.triggerEntityType}, ${currentNodeId},
        ${ownerId}, ${startedAt}, ${completedAt}, ${run.failedReason ?? null},
        ${JSON.stringify(run.context)}, ${startedAt}, ${completedAt ?? startedAt}
      )
    `;

    // Add run steps for completed/failed runs
    if ((run.status === "completed" || run.status === "failed") && wf.nodes && Object.keys(wf.nodes).length > 0) {
      const nodeEntries = Object.entries(wf.nodes);
      const stepsToAdd = run.status === "completed" ? nodeEntries : nodeEntries.slice(0, Math.ceil(nodeEntries.length / 2));
      for (let si = 0; si < stepsToAdd.length; si++) {
        const [, nodeId] = stepsToAdd[si];
        const stepStart = new Date(new Date(startedAt).getTime() + si * 3600000).toISOString();
        const isLast = si === stepsToAdd.length - 1;
        const stepStatus = run.status === "failed" && isLast ? "failed" : "completed";
        const stepEnd = run.status === "failed" && isLast
          ? new Date(new Date(stepStart).getTime() + 1800000).toISOString()
          : new Date(new Date(stepStart).getTime() + 900000).toISOString();
        await sql`
          insert into workflow_run_steps (
            id, run_id, organization_id, node_id, status,
            started_at, completed_at, output_data, error_message, created_at
          ) values (
            ${randomUUID()}, ${runId}, ${orgId}, ${nodeId}, ${stepStatus},
            ${stepStart}, ${stepEnd},
            ${JSON.stringify({ step: si + 1, result: stepStatus === "completed" ? "ok" : "error" })},
            ${stepStatus === "failed" ? (run.failedReason ?? "Step execution error") : null},
            ${stepStart}
          )
        `;
      }
    }

    // Add approval for waiting runs
    if (run.hasApproval && run.status === "waiting" && wf.nodes) {
      const approvalKey = Object.keys(wf.nodes).find((k) =>
        wf.def.nodes.find((n) => n.key === k && n.node_type === "approval")
      );
      // Fall back to the middle node if no approval node exists in this workflow
      const approvalNodeKeys = Object.keys(wf.nodes);
      const fallbackKey = approvalNodeKeys[Math.floor(approvalNodeKeys.length / 2)];
      const approvalNodeId = approvalKey ? wf.nodes[approvalKey] : wf.nodes[fallbackKey];

      if (approvalNodeId) {
        await sql`
          insert into workflow_approvals (
            id, run_id, node_id, organization_id, approver_id,
            status, decision_notes, delegated_to, decided_at,
            due_date, created_at, updated_at
          ) values (
            ${randomUUID()}, ${runId}, ${approvalNodeId}, ${orgId}, ${ownerId},
            'pending', null, null, null,
            ${daysFromNow(3).split("T")[0]}, ${startedAt}, ${startedAt}
          )
        `;
        log(`  + approval (pending, due ${daysFromNow(3).split("T")[0]}): ${wf.def.name}`);
      }
    }

    log(`  run [${run.status.padEnd(9)}]: ${wf.def.name} — ${JSON.stringify(run.context)}`);
  }
}

await sql.end();
console.log("\n✅ Done.");
