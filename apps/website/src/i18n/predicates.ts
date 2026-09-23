import type { Locale } from "./routes";

const labels = {
  has_name: ["Name", "Nombre"],
  classified_as: ["Classification", "Clasificación"],
  described_as: ["Description", "Descripción"],
  made_of: ["Material", "Material"],
  made_at: ["Made at", "Hecho en"],
  made_during: ["Made during", "Hecho durante"],
  found_at: ["Found at", "Encontrado en"],
  located_at: ["Located at", "Ubicado en"],
  held_by: ["Reported holder", "Custodia informada"],
  refers_to: ["Refers to", "Se refiere a"],
  depicts: ["Depicts", "Representa"],
  authored_by: ["Authored by", "Creado por"],
  published_by: ["Published by", "Publicado por"],
  possibly_same_as: ["Possibly the same as", "Posiblemente el mismo que"],
  physical_remains_of: ["Physical remains of", "Restos físicos de"],
  moved_item: ["Item moved", "Objeto trasladado"],
  moved_from: ["Moved from", "Trasladado desde"],
  moved_to: ["Moved to", "Trasladado a"],
  moved_via: ["Moved via", "Trasladado mediante"],
  carried_out_by: ["Carried out by", "Realizado por"],
  commanded_by: ["Commanded by", "Comandado por"],
  transferred_item: ["Item transferred", "Objeto transferido"],
  transferred_to: ["Transferred to", "Transferido a"],
  transferred_from: ["Transferred from", "Transferido desde"],
  held_item: ["Item held", "Objeto bajo custodia"],
  holding_agent: ["Holding agent", "Agente custodio"],
  occurred_at: ["Occurred at", "Ocurrió en"],
  occurred_during: ["Occurred during", "Ocurrió durante"],
} as const;
export function predicateLabel(predicate: string, locale: Locale) {
  const entry = labels[predicate as keyof typeof labels];
  return entry ? entry[locale === "en" ? 0 : 1] : predicate.replaceAll("_", " ");
}
