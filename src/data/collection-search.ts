export interface ObjectSearchImage {
  image: {
    alt: string;
    caption?: string;
    credit?: string;
    rights?: string;
  };
  source: { title: string };
}

export interface ObjectSearchClaim {
  claim: { predicate: string; value: string };
  source: { title: string; reference: string };
}

export interface ObjectSearchSource {
  title: string;
  reference: string;
}

export interface ObjectSearchInput {
  object: { id: string; name: string };
  sources: readonly ObjectSearchSource[];
  claims: readonly ObjectSearchClaim[];
  images: readonly ObjectSearchImage[];
}

export function buildObjectSearchExact({ object, sources, claims, images }: ObjectSearchInput) {
  return [
    object.id,
    object.name,
    ...sources.flatMap(({ title, reference }) => [title, reference]),
    ...claims.map(
      ({ claim, source }) =>
        `${claim.predicate} ${claim.value} ${source.title} ${source.reference}`,
    ),
    ...images.flatMap(({ image, source }) => [
      source.title,
      image.alt,
      image.caption ?? "",
      image.credit ?? "",
      image.rights ?? "",
    ]),
  ].join(" ");
}
