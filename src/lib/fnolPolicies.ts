/* ═══════════════════════════════════════════════════════════════════════
   fnolPolicies.ts  →  src/lib/fnolPolicies.ts
   Real Guidewire policy numbers (pc-dev-gwcpdev), one per LOB.
   Sourced from PC_Policies_Reference_V1 — verified to exist in the dev env.
   ═══════════════════════════════════════════════════════════════════════ */
export const FNOL_POLICIES: Record<string, string> = {
  // A Welch · USA Personal Auto · WI · Liability 25/50/10 · 1987 Acura Legend
  // ⭐ Confirmed working in the PC→CC integration — safest demo create.
  'auto':            '7819142859',

  // wtrls nqbyf · Homeowners Product · FL · $225 real premium (only policy w/ real premium data)
  'home':            '1784278359',

  // Calloway Cheese Factory · USA Personal Auto · CA · real business name → reads as commercial.
  // NOTE: PC sandbox has no true commercial-auto product; this is a personal-auto policy.
  'commercial-auto': '0077432930',

  // Glass claims attach to the auto policy.
  'glass':           '7819142859',
}

export const policyFor = (lob: string): string =>
  FNOL_POLICIES[lob] || FNOL_POLICIES['auto']
