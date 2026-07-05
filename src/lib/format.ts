// Helpers d'affichage autour de l'unité maison : le cm, et le palier des bites.

export const CM_PER_BITE = 21;

export function bitesFromCm(totalCm: number): number {
  return Math.floor(totalCm / CM_PER_BITE);
}

export function resteFromCm(totalCm: number): number {
  return totalCm - bitesFromCm(totalCm) * CM_PER_BITE;
}

/** "34 cm" (garde le signe pour les points négatifs comme le refus). */
export function cm(value: number): string {
  return `${value} cm`;
}

/** Signe explicite pour un barème : "+3", "-1". */
export function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

/** "2 🍆" — les bites de surf, cumulables. */
export function bitesLabel(count: number): string {
  return `${count} 🍆`;
}

/** Résumé compact d'un score : "2 🍆 · 5 cm". */
export function scoreSummary(totalCm: number): string {
  return `${bitesLabel(bitesFromCm(totalCm))} · ${cm(resteFromCm(totalCm))}`;
}

/** Progression [0..1] vers la prochaine bite. */
export function progressToNextBite(totalCm: number): number {
  return resteFromCm(totalCm) / CM_PER_BITE;
}

/** Initiales pour un avatar de secours. */
export function initials(pseudo: string | null | undefined): string {
  if (!pseudo) return '?';
  return pseudo.trim().slice(0, 2).toUpperCase();
}
