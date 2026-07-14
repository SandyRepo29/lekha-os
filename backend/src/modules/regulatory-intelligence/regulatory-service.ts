import * as repo from "@/backend/src/modules/regulatory-intelligence/regulatory-intelligence-repo";

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardData(orgId: string) {
  const [metrics, recentChanges, openAlerts, openTasks, updates, readiness] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.findChangesByOrg(orgId, { limit: 5 }),
    repo.findAlertsByOrg(orgId, { status: "open" }),
    repo.findTasksByOrg(orgId, { status: "open" }),
    repo.findUpdatesByOrg(orgId, 5),
    repo.getReadinessData(orgId),
  ]);
  return { metrics, recentChanges, openAlerts, openTasks, updates, readiness };
}

// ─── Regulations ─────────────────────────────────────────────────────────────

export async function getRegulations(orgId: string) {
  return repo.findAllRegulations(orgId);
}

export async function getRegulationById(orgId: string, id: string) {
  const reg = await repo.findRegulationById(orgId, id);
  if (!reg) throw new Error("Regulation not found.");
  return reg;
}

export async function createRegulation(orgId: string, userId: string, data: {
  name: string; shortName?: string; authority?: string; country?: string;
  region?: string; industry?: string; category?: string; version?: string;
  effectiveDate?: string; reviewDate?: string; sourceUrl?: string; description?: string;
}) {
  return repo.insertRegulation({
    organizationId: orgId,
    createdBy: userId,
    name: data.name,
    shortName: data.shortName,
    authority: data.authority,
    country: data.country,
    region: data.region,
    industry: data.industry,
    category: data.category ?? "security",
    version: data.version,
    effectiveDate: data.effectiveDate,
    reviewDate: data.reviewDate,
    sourceUrl: data.sourceUrl,
    description: data.description,
    isBuiltin: false,
    isApplicable: true,
  });
}

export async function updateRegulation(orgId: string, id: string, data: Record<string, unknown>) {
  return repo.updateRegulation(orgId, id, data);
}

export async function deleteRegulation(orgId: string, id: string) {
  return repo.deleteRegulation(orgId, id);
}

// ─── Regulatory Changes ──────────────────────────────────────────────────────

export async function getChanges(orgId: string, filters?: { status?: string; severity?: string }) {
  return repo.findChangesByOrg(orgId, filters);
}

export async function createChange(orgId: string, userId: string, data: {
  title: string; description?: string; changeType?: string; severity?: string;
  regulationId?: string; source?: string; sourceUrl?: string;
  publishedDate?: string; effectiveDate?: string;
}) {
  const change = await repo.insertChange({
    organizationId: orgId,
    createdBy: userId,
    title: data.title,
    description: data.description,
    changeType: data.changeType ?? "amendment",
    severity: data.severity ?? "medium",
    status: "new",
    regulationId: data.regulationId,
    source: data.source,
    sourceUrl: data.sourceUrl,
    publishedDate: data.publishedDate,
    effectiveDate: data.effectiveDate,
  });

  // Auto-generate alert for high/critical changes
  if (data.severity === "high" || data.severity === "critical") {
    await repo.insertAlert({
      organizationId: orgId,
      regulationId: data.regulationId,
      changeId: change.id,
      title: `${data.severity === "critical" ? "Critical" : "High"} regulatory change detected: ${data.title}`,
      description: data.description,
      alertType: "change_detected",
      severity: data.severity,
      status: "open",
    });
  }

  return change;
}

export async function updateChangeStatus(orgId: string, id: string, status: string) {
  return repo.updateChange(orgId, id, { status });
}

// ─── Obligations ─────────────────────────────────────────────────────────────

export async function getObligations(orgId: string, filters?: { status?: string; regulationId?: string; priority?: string }) {
  return repo.findObligationsByOrg(orgId, filters);
}

export async function getObligationById(orgId: string, id: string) {
  const ob = await repo.findObligationById(orgId, id);
  if (!ob) throw new Error("Obligation not found.");
  const mappings = await repo.findMappingsByObligation(id);
  return { ...ob, mappings };
}

export async function createObligation(orgId: string, userId: string | null, data: {
  title: string; description?: string; requirement?: string; obligationRef?: string;
  category?: string; priority?: string; regulationId?: string; ownerId?: string;
  businessUnit?: string; reviewDate?: string; dueDate?: string; evidenceRequirements?: string;
}) {
  return repo.insertObligation({
    organizationId: orgId,
    createdBy: userId,
    title: data.title,
    description: data.description,
    requirement: data.requirement,
    obligationRef: data.obligationRef,
    category: data.category,
    priority: data.priority ?? "medium",
    status: "not_started",
    regulationId: data.regulationId,
    ownerId: data.ownerId,
    businessUnit: data.businessUnit,
    reviewDate: data.reviewDate,
    dueDate: data.dueDate,
    evidenceRequirements: data.evidenceRequirements,
  });
}

export async function updateObligationStatus(orgId: string, id: string, status: string) {
  return repo.updateObligation(orgId, id, { status });
}

export async function updateObligation(orgId: string, id: string, data: Record<string, unknown>) {
  return repo.updateObligation(orgId, id, data);
}

export async function deleteObligation(orgId: string, id: string) {
  return repo.deleteObligation(orgId, id);
}

// ─── Assessments ─────────────────────────────────────────────────────────────

export async function getAssessments(orgId: string, filters?: { status?: string }) {
  return repo.findAssessmentsByOrg(orgId, filters);
}

export async function getAssessmentById(orgId: string, id: string) {
  const assessment = await repo.findAssessmentById(orgId, id);
  if (!assessment) throw new Error("Assessment not found.");
  const impacts = await repo.findImpactsByAssessment(id);
  return { ...assessment, impacts };
}

export async function createAssessment(orgId: string, userId: string | null, data: {
  title: string; changeId?: string; regulationId?: string; impactLevel?: string;
  summary?: string; ownerId?: string; dueDate?: string;
}) {
  return repo.insertAssessment({
    organizationId: orgId,
    createdBy: userId,
    title: data.title,
    changeId: data.changeId,
    regulationId: data.regulationId,
    impactLevel: data.impactLevel ?? "medium",
    status: "draft",
    summary: data.summary,
    ownerId: data.ownerId,
    dueDate: data.dueDate,
  });
}

export async function updateAssessmentStatus(orgId: string, id: string, status: string) {
  const data: Record<string, unknown> = { status };
  if (status === "completed") data.completedAt = new Date();
  return repo.updateAssessment(orgId, id, data);
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export async function getAlerts(orgId: string, filters?: { status?: string; severity?: string }) {
  return repo.findAlertsByOrg(orgId, filters);
}

export async function resolveAlert(orgId: string, id: string, userId: string) {
  return repo.resolveAlert(orgId, id, userId);
}

export async function acknowledgeAlert(orgId: string, id: string) {
  return repo.acknowledgeAlert(orgId, id);
}

// ─── Watchlists ───────────────────────────────────────────────────────────────

export async function getWatchlists(orgId: string) {
  return repo.findWatchlistsByOrg(orgId);
}

export async function createWatchlist(orgId: string, userId: string, data: {
  name: string; description?: string; watchType?: string; criteria?: Record<string, unknown>;
}) {
  return repo.insertWatchlist({
    organizationId: orgId,
    createdBy: userId,
    name: data.name,
    description: data.description,
    watchType: data.watchType ?? "regulation",
    criteria: data.criteria ?? {},
    isActive: true,
    alertOnChange: true,
  });
}

export async function deleteWatchlist(orgId: string, id: string) {
  return repo.deleteWatchlist(orgId, id);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(orgId: string, filters?: { status?: string; priority?: string }) {
  return repo.findTasksByOrg(orgId, filters);
}

export async function createTask(orgId: string, userId: string, data: {
  title: string; description?: string; taskType?: string; priority?: string;
  changeId?: string; assessmentId?: string; obligationId?: string;
  ownerId?: string; dueDate?: string;
}) {
  return repo.insertTask({
    organizationId: orgId,
    createdBy: userId,
    title: data.title,
    description: data.description,
    taskType: data.taskType ?? "review",
    priority: data.priority ?? "medium",
    status: "open",
    changeId: data.changeId,
    assessmentId: data.assessmentId,
    obligationId: data.obligationId,
    ownerId: data.ownerId,
    dueDate: data.dueDate,
  });
}

export async function updateTaskStatus(orgId: string, id: string, status: string) {
  const data: Record<string, unknown> = { status };
  if (status === "completed") data.completedAt = new Date();
  return repo.updateTask(orgId, id, data);
}

// ─── Updates Feed ─────────────────────────────────────────────────────────────

export async function getUpdates(orgId: string) {
  return repo.findUpdatesByOrg(orgId);
}

// ─── Sources ─────────────────────────────────────────────────────────────────

export async function getSources(orgId: string) {
  return repo.findSources(orgId);
}

// ─── Readiness ────────────────────────────────────────────────────────────────

export async function getReadiness(orgId: string) {
  return repo.getReadinessData(orgId);
}
