/**
 * IP Allow List enforcement — Sprint B2.1
 * Pure CIDR check, no external dependencies.
 */

import { getActiveIpRules } from "@/backend/src/modules/security-command-center/security-command-center-repo";

// ─── CIDR utilities ───────────────────────────────────────────────────────────

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

function isIpv4(ip: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
}

function extractIpv4FromMapped(ip: string): string {
  // Handle ::ffff:x.x.x.x (IPv4-mapped IPv6)
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
}

export function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const cleanIp = extractIpv4FromMapped(ip);
    if (!isIpv4(cleanIp)) return false; // IPv6 not yet supported beyond mapped
    if (!cidr.includes("/")) return cleanIp === cidr; // plain IP

    const [network, prefixStr] = cidr.split("/");
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    return (ipToInt(cleanIp) & mask) === (ipToInt(network) & mask);
  } catch {
    return false;
  }
}

// ─── Enforcement ─────────────────────────────────────────────────────────────

export type IpContext = "all" | "login" | "api" | "auditor_rooms" | "trust_exchange";

/**
 * Returns true if the request IP is allowed.
 * If no rules are configured, all IPs are allowed (open default).
 */
export async function isIpAllowed(
  orgId: string,
  requestIp: string,
  context: IpContext = "all"
): Promise<boolean> {
  if (!requestIp) return true;

  const rules = await getActiveIpRules(orgId);
  if (rules.length === 0) return true; // no rules = open

  // Filter rules that apply to this context
  const applicable = rules.filter(
    r => r.appliesTo === "all" || r.appliesTo === context
  );
  if (applicable.length === 0) return true; // no rules for this context

  // IP is allowed if it matches ANY applicable rule (whitelist semantics)
  return applicable.some(r => isIpInCidr(requestIp, r.cidrRange));
}

/** Extract client IP from Next.js request headers. */
export function extractRequestIp(
  headers: Record<string, string | string[] | undefined>
): string {
  const forwardedFor = headers["x-forwarded-for"];
  if (forwardedFor) {
    const first = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(",")[0];
    return first.trim();
  }
  return (headers["x-real-ip"] as string) ?? "";
}
