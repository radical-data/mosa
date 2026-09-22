import type { ClientBase } from "pg";
import { CaptureError } from "./model.js";

export interface Catalogue {
  namespace: string;
  label: string | null;
}

export async function catalogueChoices(client: ClientBase): Promise<Catalogue[]> {
  return (
    await client.query<Catalogue>(
      "select namespace,label from entities.catalogue order by coalesce(label,namespace),namespace",
    )
  ).rows;
}

export function catalogueLabel(catalogue: Catalogue) {
  return catalogue.label ?? `Unnamed catalogue (${catalogue.namespace})`;
}

export async function saveCatalogue(client: ClientBase, form: FormData): Promise<void> {
  const label = String(form.get("label") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!label || label.length > 200)
    throw new CaptureError("Enter a catalogue name of up to 200 characters.");
  const namespace = String(form.get("namespace") ?? "");
  try {
    if (namespace) {
      const previous = String(form.get("previousLabel") ?? "") || null;
      const result = await client.query(
        "update entities.catalogue set label=$2 where namespace=$1 and label is not distinct from $3 returning namespace",
        [namespace, label, previous],
      );
      if (!result.rowCount)
        throw new CaptureError(
          "This catalogue changed or is no longer available. Reload before renaming it.",
        );
    } else {
      await client.query("insert into entities.catalogue(label) values($1)", [label]);
    }
  } catch (error) {
    if ((error as { code?: string }).code === "23505")
      throw new CaptureError(
        "A catalogue with that name already exists. Use it, or give this numbering system a distinct name.",
      );
    throw error;
  }
}

export async function requireCatalogue(client: ClientBase, namespace: string) {
  if (
    namespace &&
    !(await client.query("select 1 from entities.catalogue where namespace=$1", [namespace]))
      .rowCount
  )
    throw new CaptureError(
      "Choose an existing catalogue, or add it using ‘Add or rename catalogues’.",
      "catalogue",
    );
}
