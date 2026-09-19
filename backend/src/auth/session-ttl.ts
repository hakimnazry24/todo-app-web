/** Session lifetime, in minutes. Defaults to the 30 minutes the app requires. */
export const DEFAULT_SESSION_TTL_MINUTES = 30;

export function resolveSessionTtlMinutes(raw: string | undefined): number {
  const minutes = Number(raw);
  return Number.isFinite(minutes) && minutes > 0
    ? minutes
    : DEFAULT_SESSION_TTL_MINUTES;
}
