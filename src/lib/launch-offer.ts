/** Pure campaign rules shared by the server, UI and boundary checks. */
export function offerSecondsLeft(expiresAt: number, now: number): number {
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

export function offerClock(seconds: number): string[] {
  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ].map((value) => String(value).padStart(2, '0'));
}
