// Identifier systems are independent of custody and attribution. Never infer
// the holding institution from the website hosting a catalogue.
export const catalogues = [
  { id: "british-museum", label: "British Museum — museum number" },
  { id: "british-museum-aoa", label: "British Museum — registration number (AOA)" },
  { id: "te-papa-inventory", label: "Te Papa — inventory number" },
  { id: "kunstkamera", label: "Kunstkamera — catalogue number" },
  { id: "sscc-catalogue", label: "Congregation of the Sacred Hearts — catalogue number" },
] as const;
export function catalogueLabel(id: string) {
  return catalogues.find((catalogue) => catalogue.id === id)?.label ?? id;
}
