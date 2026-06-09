"use server";

import { requireUser } from "@/lib/auth/session";
import { buildGraph } from "@/lib/services/trust-graph/graph-builder";
import { getGraphData, getRootCause, getImpactAnalysis } from "@/lib/services/trust-graph/graph-service";
import { generateGraphSummary, chat } from "@/lib/services/trust-graph/ai-graph-service";
import { getNodeWithNeighbours } from "@/lib/repositories/trust-graph-repo";
import { revalidatePath } from "next/cache";

export async function buildGraphAction() {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const result = await buildGraph(session.org.id);
    revalidatePath("/trust-intelligence/trust-graph");
    return { data: result };
  } catch (e: any) {
    return { error: e.message ?? "Failed to build graph." };
  }
}

export async function getGraphDataAction() {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const data = await getGraphData(session.org.id);
    return { data };
  } catch (e: any) {
    return { error: e.message ?? "Failed to load graph." };
  }
}

export async function getNodeNeighboursAction(nodeId: string) {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const data = await getNodeWithNeighbours(session.org.id, nodeId);
    return { data };
  } catch (e: any) {
    return { error: e.message ?? "Failed to load node." };
  }
}

export async function getRootCauseAction(nodeId: string) {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const data = await getRootCause(session.org.id, nodeId);
    return { data };
  } catch (e: any) {
    return { error: e.message ?? "Failed to analyse root cause." };
  }
}

export async function getImpactAnalysisAction(nodeId: string) {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const data = await getImpactAnalysis(session.org.id, nodeId);
    return { data };
  } catch (e: any) {
    return { error: e.message ?? "Failed to analyse impact." };
  }
}

export async function generateGraphSummaryAction() {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const text = await generateGraphSummary(session.org.id);
    return { data: text };
  } catch (e: any) {
    return { error: e.message ?? "Failed to generate summary." };
  }
}

export async function graphChatAction(message: string, history: Array<{ role: string; text: string }>) {
  const session = await requireUser();
  if (!session.org) return { error: "No organisation." };
  try {
    const text = await chat(session.org.id, message, history);
    return { data: text };
  } catch (e: any) {
    return { error: e.message ?? "Failed to chat." };
  }
}
