import type { Unit } from "@/types";

type UnitLike = Pick<Unit, "unitNumber"> & { label?: string | null };

/**
 * Nom d'affichage d'un local : le libellé d'abord, puis le code généré
 * (ex : « Appartement 3 pièces (IMM-AKP-001-003) »). Les utilisateurs
 * repèrent les locaux par leur libellé, pas par le code.
 * Sans libellé : « Local IMM-AKP-001-003 ».
 */
export function formatUnitName(unit: UnitLike): string {
  const label = unit.label?.trim();
  if (!label) return `Local ${unit.unitNumber}`;
  return unit.unitNumber ? `${label} (${unit.unitNumber})` : label;
}
