import { type Locale, type ResourceId, resourcePath } from "../i18n/routes";

export interface Organisation {
  id: string;
  name: string;
  url: string;
  tags: string[];
  description: Record<Locale, string>;
}

export const organisations: readonly Organisation[] = [
  {
    id: "karanga-aotearoa",
    name: "Karanga Aotearoa Repatriation Programme",
    url: "https://www.tepapa.govt.nz/about/repatriation/karanga-aotearoa-repatriation-programme",
    tags: ["Māori", "Moriori", "repatriation"],
    description: {
      es: "Programa del Museo de Nueva Zelandia Te Papa Tongarewa que coordina la repatriación de ancestros māori y moriori desde instituciones nacionales e internacionales.",
      en: "Te Papa Tongarewa’s programme coordinating the repatriation of Māori and Moriori ancestors from institutions in Aotearoa New Zealand and overseas.",
    },
  },
  {
    id: "local-contexts",
    name: "Local Contexts",
    url: "https://localcontexts.org/",
    tags: ["Indigenous data sovereignty", "cultural authority"],
    description: {
      es: "Iniciativa global que ofrece herramientas para que las comunidades indígenas expresen su autoridad cultural en colecciones y datos patrimoniales.",
      en: "A global initiative offering tools that enable Indigenous communities to express cultural authority in heritage collections and data.",
    },
  },
  {
    id: "mukurtu",
    name: "Mukurtu",
    url: "https://mukurtu.org/",
    tags: ["digital heritage", "community platforms"],
    description: {
      es: "Proyecto comunitario que desarrolla herramientas para gestionar, compartir e intercambiar patrimonio digital de formas culturalmente pertinentes y éticas.",
      en: "A community-led project developing tools to manage, share and exchange digital heritage in culturally relevant and ethical ways.",
    },
  },
  {
    id: "open-restitution-project",
    name: "The Open Restitution Project",
    url: "https://openrestitution.africa/",
    tags: ["Africa", "research", "restitution"],
    description: {
      es: "Proyecto liderado desde África que busca ampliar el acceso a información sobre la restitución de objetos culturales y ancestros, para apoyar decisiones informadas.",
      en: "An Africa-led project opening access to information on the restitution of cultural objects and ancestors to support informed decisions.",
    },
  },
  {
    id: "nz-repatriation-research-network",
    name: "New Zealand Repatriation Research Network",
    url: "https://www.tepapa.govt.nz/learn/for-museums-and-galleries/how-guides/collection-management/collection-management-repatriatio-6",
    tags: ["Aotearoa New Zealand", "research network"],
    description: {
      es: "Red de museos que comparte investigación y asesoría para identificar kōiwi en colecciones y apoyar su repatriación.",
      en: "A museum network sharing research and advice to identify kōiwi in collections and support their repatriation.",
    },
  },
  {
    id: "ngakahu",
    name: "Ngākahu National Repatriation Project",
    url: "https://www.tepapa.govt.nz/learn/for-museums-and-galleries/help-and-support-for-museums-and-galleries/ngakahu-national",
    tags: ["Māori", "kōiwi tūpuna"],
    description: {
      es: "Proyecto nacional que apoya a museos, iwi, hapū y otras comunidades en el retorno de kōiwi tūpuna a sus comunidades descendientes.",
      en: "A national project supporting museums, iwi, hapū and other communities to return kōiwi tūpuna to descendant communities.",
    },
  },
  {
    id: "return-reconcile-renew",
    name: "Return Reconcile Renew",
    url: "https://returnreconcilerenew.info/",
    tags: ["Australia", "ancestors", "repatriation"],
    description: {
      es: "Iniciativa que acompaña a comunidades en la búsqueda y el retorno de sus ancestros llevados a museos, y en la renovación de relaciones con el territorio.",
      en: "An initiative supporting communities to find and return ancestors taken to museums, and to renew relationships with Country.",
    },
  },
  {
    id: "indigen",
    name: "IndiGen",
    url: "https://www.indigen.eu/",
    tags: ["research", "Indigeneity", "Europe"],
    description: {
      es: "Proyecto de investigación interdisciplinaria sobre las indigeneidades emergentes y la renegociación de legados poscoloniales en Europa.",
      en: "An interdisciplinary research project on re-emerging Indigeneities and the renegotiation of postcolonial legacies in Europe.",
    },
  },
  {
    id: "traductor-rapa-nui",
    name: "Traductor Rapa Nui",
    url: "https://traductorrapanui.cl/about",
    tags: ["rapa nui", "language", "translation"],
    description: {
      es: "Iniciativa que desarrolla modelos de traducción automática rapa nui–español junto a la Academia de la Lengua Rapa Nui ꞌUmaŋa Hatu Reꞌo, el Centro Nacional de Inteligencia Artificial y Estudios Aplicados de Antropología UC.",
      en: "An initiative developing Rapa Nui–Spanish machine translation with the Rapa Nui Language Academy ꞌUmaŋa Hatu Reꞌo, the National Centre for Artificial Intelligence and UC Applied Anthropology Studies.",
    },
  },
  {
    id: "returning-heritage",
    name: "Returning Heritage",
    url: "https://www.returningheritage.com/",
    tags: ["research", "archive", "visibility"],
    description: {
      es: "Recurso sin fines de lucro con noticias, análisis y un archivo internacional sobre debates e iniciativas de restitución cultural.",
      en: "A not-for-profit resource with news, commentary and an international archive on cultural restitution debates and initiatives.",
    },
  },
  {
    id: "decolonize-berlin",
    name: "Decolonize Berlin",
    url: "https://decolonize-berlin.de/de/home",
    tags: ["Berlin", "decolonisation", "civil society"],
    description: {
      es: "Alianza de organizaciones y activistas que promueve una revisión crítica de la historia y el presente del colonialismo y el racismo.",
      en: "An alliance of organisations and activists advocating critical engagement with the history and present of colonialism and racism.",
    },
  },
  {
    id: "colonial-contexts-collections",
    name: "Collections from Colonial Contexts",
    url: "https://ccc.deutsche-digitale-bibliothek.de/en",
    tags: ["Germany", "database", "transparency"],
    description: {
      es: "Portal que reúne información sobre la ubicación de objetos procedentes de contextos coloniales en instituciones culturales alemanas.",
      en: "A portal bringing together information on the location of objects from colonial contexts in German cultural institutions.",
    },
  },
  {
    id: "native-land-digital",
    name: "Native Land Digital",
    url: "https://native-land.ca/",
    tags: ["Indigenous lands", "maps"],
    description: {
      es: "Organización indígena que crea mapas para cuestionar y ampliar cómo entendemos los territorios, sus pueblos y sus historias.",
      en: "An Indigenous-led organisation creating maps that challenge and expand how we understand lands, peoples and their histories.",
    },
  },
];

export interface ReadingLink {
  title: Record<Locale, string>;
  url: string;
  group: "guides" | "rights" | "cases" | "initiatives";
  note?: Record<Locale, string>;
  secondary?: { title: Record<Locale, string>; url: string };
}
export const readings: readonly ReadingLink[] = [
  {
    title: { es: "Guía de repatriación internacional", en: "International Repatriation Guide" },
    url: "https://www.indian-affairs.org/uploads/8/7/3/8/87380358/international_repatriation_guide.pdf",
    group: "guides",
  },
  {
    title: {
      es: "Guía práctica sobre restitución y repatriación para museos de Inglaterra",
      en: "Restitution and repatriation: a practical guide for museums in England",
    },
    url: "https://www.artscouncil.org.uk/supporting-arts-museums-and-libraries/supporting-collections-and-cultural-property/restitution-and-repatriation-practical-guide-museums-england",
    group: "guides",
  },
  {
    title: {
      es: "Orientaciones para la restitución y el retorno de colecciones de museos universitarios",
      en: "Guidance for restitution and return from university museums and collections",
    },
    url: "https://umac.icom.museum/wp-content/uploads/2022/03/UMAC-Guidance-Restitution-2022.pdf",
    group: "guides",
  },
  {
    title: {
      es: "Recurso de la Biblioteca Digital de la UNESCO sobre restitución",
      en: "UNESCO Digital Library resource on restitution",
    },
    url: "https://unesdoc.unesco.org/ark:/48223/pf0000385275_eng",
    group: "guides",
  },
  {
    title: {
      es: "Protocolo de Consulta Previa, Libre e Informada a Pueblos Originarios",
      en: "Protocol for Free, Prior and Informed Consultation with Indigenous Peoples",
    },
    url: "https://drive.google.com/file/d/0B7mfpufuTf3UWjdRQzdnZFpoc28/edit?resourcekey=0-AWSGQ5aKA3IdawuKiNEM3w",
    group: "rights",
  },
  {
    title: {
      es: "Declaración Universal de los Derechos Humanos",
      en: "Universal Declaration of Human Rights",
    },
    url: "https://www.ohchr.org/en/human-rights/universal-declaration/translations/spanish",
    group: "rights",
  },
  {
    title: {
      es: "Declaración de las Naciones Unidas sobre los Derechos de los Pueblos Indígenas",
      en: "United Nations Declaration on the Rights of Indigenous Peoples",
    },
    url: "https://www.un.org/esa/socdev/unpfii/documents/DRIPS_es.pdf",
    group: "rights",
  },
  {
    title: { es: "Casos de retorno y restitución", en: "Return and restitution cases" },
    url: "https://www.unesco.org/en/fight-illicit-trafficking/return-and-restitution-cases",
    group: "cases",
  },
  {
    title: { es: "Archivo geográfico de restituciones", en: "Geographic archive of restitutions" },
    url: "https://www.returningheritage.com/geographic-archive#RestitutionsbyCountry",
    group: "cases",
  },
  {
    title: {
      es: "Fault Lines: futuros indígenas para colecciones coloniales",
      en: "Fault Lines: imagining Indigenous futures for colonial collections",
    },
    url: "https://maa.cam.ac.uk/fault-lines-exhibition-catalogue",
    group: "initiatives",
    note: {
      es: "Catálogo de la exposición y publicación descargable.",
      en: "Exhibition catalogue with a downloadable publication.",
    },
  },
  {
    title: { es: "We Want Them Back!", en: "We Want Them Back!" },
    url: "https://decolonize-berlin.de/de/wewantthemback",
    group: "initiatives",
    note: {
      es: "Campaña y publicaciones sobre restos humanos de contextos coloniales en Berlín.",
      en: "Campaign and publications on human remains from colonial contexts in Berlin.",
    },
    secondary: {
      title: {
        es: "Informe científico en inglés sobre restos humanos de contextos coloniales en Berlín (PDF)",
        en: "Scientific report on human remains from colonial contexts in Berlin (English PDF)",
      },
      url: "https://wwtb-cms.decolonize-berlin.de/media/pages/tools-section/a0603df58f-1710419775/we-want-them-back_english-web-6.pdf",
    },
  },
  {
    title: { es: "No Humboldt 21!", en: "No Humboldt 21!" },
    url: "https://www.no-humboldt21.de",
    group: "initiatives",
  },
  {
    title: {
      es: "Orientaciones conjuntas sobre bienes culturales y restos humanos de contextos coloniales",
      en: "Joint Guidelines on cultural property and human remains from colonial contexts",
    },
    url: "https://www.germancontactpoint.org/relevant_documents/joint_guidelines.php",
    group: "initiatives",
  },
  {
    title: {
      es: "La sociedad civil considera insuficientes las directrices sobre patrimonio colonial",
      en: "Civil society: guidelines on colonial heritage are inadequate",
    },
    url: "https://decolonize-berlin.de/de/verein/leitlinien-koloniales-erbe-unzureichend",
    group: "initiatives",
  },
  {
    title: { es: "Derecho y práctica decoloniales", en: "Decolonial law and practice" },
    url: "https://decolonize-berlin.de/de/publikationen/dekoloniale-rechtswissenschaft-und-praxis",
    group: "initiatives",
  },
];

export const resourceLabels: Record<
  Locale,
  Record<ResourceId, { title: string; description: string }>
> = {
  es: {
    guide: {
      title: "Guía de restitución",
      description:
        "Una guía nacida en Rapa Nui para iniciar, sostener y acompañar procesos de restitución desde relaciones y autoridades propias.",
    },
    letter: {
      title: "Modelo de carta de solicitud",
      description:
        "Una estructura adaptable para abrir una conversación y dejar claro qué se solicita, quién decide y qué pasos siguen.",
    },
    directory: {
      title: "Directorio de organizaciones",
      description:
        "Organizaciones, redes y herramientas que trabajan en restitución, memoria, lenguas y soberanía de datos.",
    },
    actors: {
      title: "Mapeo de actores",
      description:
        "Una red de relaciones posibles, posiciones y condiciones que pueden intervenir en cada proceso.",
    },
  },
  en: {
    guide: {
      title: "Restitution guide",
      description:
        "A guide rooted in Rapa Nui for beginning, sustaining and supporting restitution processes from within local relationships and authority.",
    },
    letter: {
      title: "Restitution request letter template",
      description:
        "An adaptable structure for opening a conversation and making clear what is requested, who decides and what follows.",
    },
    directory: {
      title: "Directory of organisations",
      description:
        "Organisations, networks and tools working on restitution, memory, languages and data sovereignty.",
    },
    actors: {
      title: "Participant map",
      description:
        "A network of possible relationships, positions and conditions that may shape each process.",
    },
  },
};

export function getResources(locale: Locale) {
  return (Object.keys(resourceLabels[locale]) as ResourceId[]).map((id) => ({
    id,
    path: resourcePath(id, locale),
    title: resourceLabels[locale][id].title,
    description: resourceLabels[locale][id].description,
  }));
}

export const guideSections: Record<
  Locale,
  { id: string; label: string; heading: string; intro: string; points: string[] }[]
> = {
  es: [
    {
      id: "begin",
      label: "Comenzar",
      heading: "Comenzar desde lo que sabemos",
      intro:
        "Una ausencia, un nombre, una fotografía o una historia familiar pueden abrir una búsqueda. No hace falta tener todo resuelto para dar el primer paso.",
      points: [
        "Anota qué o quién está lejos y qué se conoce hasta ahora.",
        "Busca catálogos, archivos, publicaciones, fotografías y relatos orales; prueba variantes de nombres y errores de escritura.",
        "Habla con quienes tienen una relación, responsabilidad o autoridad sobre su cuidado y futuro.",
        "Reconoce la relación interrumpida: puede ser ancestral, espiritual, territorial, familiar, ceremonial, cultural o política.",
        "Acuerda qué información se comparte, con quién y para qué. Algunas imágenes, nombres, lugares o conocimientos espirituales pueden requerir protección.",
        "Define qué se busca ahora: acceder a información, corregir un registro, detener una exhibición, retirar imágenes, transferir titularidad o iniciar la restitución.",
      ],
    },
    {
      id: "translate",
      label: "Traducir",
      heading: "Entender el sistema sin dejar que defina la relación",
      intro:
        "En algún momento aparecen términos institucionales como procedencia, titularidad legal, baja de colección o licencia de exportación. Traducir es comprender lo necesario para intervenir sin permitir que esas categorías definan por completo el vínculo.",
      points: [
        "Identifica quién tiene la custodia, quién posee la titularidad legal, quién autoriza el retorno y qué órgano toma la decisión final.",
        "Pregunta qué procedimiento, política o norma aplica y quién financia investigación, preparación y traslado.",
        "Solicita el archivo completo: registros de adquisición, inventarios anteriores, correspondencia, diarios, fotografías, muestras y datos derivados.",
        "Guarda la información con fechas y fuentes, separando hechos documentados, testimonios, dudas y preguntas abiertas.",
        "La institución también debe investigar y abrir sus archivos; esa labor no debe recaer únicamente en la comunidad.",
      ],
    },
    {
      id: "sustain",
      label: "Sostener",
      heading: "Sostener el proceso y el mandato",
      intro:
        "El diálogo puede abrir posibilidades, pero no debe reemplazar indefinidamente una decisión. Sostener implica cuidar el mandato colectivo, registrar lo que ocurre y pedir respuestas concretas.",
      points: [
        "Acuerda quién representa, comunica y hace seguimiento, y cómo se reconocen desacuerdos y distintas voces.",
        "Solicita por escrito responsables, etapas, plazos, criterios y próximos pasos.",
        "Registra reuniones, compromisos, cambios de interlocutor y documentos recibidos.",
        "Pide medidas provisionales cuando corresponda, por ejemplo detener nuevas exhibiciones, muestreos o publicaciones.",
        "Busca apoyo técnico, jurídico, diplomático y comunitario según el caso, sin ceder la autoridad de quienes mantienen la relación.",
      ],
    },
    {
      id: "reconnect",
      label: "Reconectar",
      heading: "Imaginar qué puede volver a ser posible",
      intro:
        "La restitución no termina con el traslado. La comunidad puede definir qué significa reconectar y qué condiciones de cuidado, acceso, investigación o ceremonia hacen sentido.",
      points: [
        "Conversa sobre destino, cuidado posterior, acceso y responsabilidades a largo plazo.",
        "Considera qué debe ocurrir durante el proceso y mientras aquello que se reclama siga lejos.",
        "Reconoce que ancestros y objetos culturales no son categorías intercambiables; los ancestros no son bienes de colección.",
        "La pregunta no es solo qué vuelve, sino qué relaciones, prácticas, memorias y capacidades pueden recomponerse.",
        "Cada pueblo define sus propios tiempos, autoridades y formas de hacer; esta guía no propone un procedimiento universal.",
      ],
    },
  ],
  en: [
    {
      id: "begin",
      label: "Start",
      heading: "Start from what we know",
      intro:
        "An absence, a name, a photograph or a family story can open a search. Everything need not be resolved before taking the first step.",
      points: [
        "Write down what or who is far away and what is known so far.",
        "Search catalogues, archives, publications, photographs and oral histories; try variant names and spelling errors.",
        "Speak with those who have a relationship, responsibility or authority over care and future.",
        "Recognise the interrupted relationship: it may be ancestral, spiritual, territorial, familial, ceremonial, cultural or political.",
        "Agree what information is shared, with whom and for what purpose. Some images, names, places or spiritual knowledge may need protection.",
        "Define what is sought now: access to information, a corrected record, stopping an exhibition, removing images, transferring title or initiating restitution.",
      ],
    },
    {
      id: "translate",
      label: "Translate",
      heading: "Understand the system without letting it define the relationship",
      intro:
        "Institutional terms may appear: provenance, legal title, deaccessioning or export licence. Translation means understanding what is needed to intervene without allowing those categories to define the relationship in full.",
      points: [
        "Identify who has custody, who holds legal title, who authorises a return and which body makes the final decision.",
        "Ask which procedure, policy or law applies and who funds research, preparation and transport.",
        "Request the complete archive: acquisition records, earlier inventories, correspondence, journals, photographs, samples and derived data.",
        "Keep dated records and sources, distinguishing documented facts, testimony, uncertainty and open questions.",
        "The institution also has a duty to investigate and open its archives; this work should not fall solely to the community.",
      ],
    },
    {
      id: "sustain",
      label: "Sustain",
      heading: "Sustain the process and its mandate",
      intro:
        "Dialogue can open possibilities, but it should not replace a decision indefinitely. Sustaining a process means protecting its mandate, recording what happens and asking for concrete responses.",
      points: [
        "Agree who represents, communicates and follows up, and how disagreement and different voices are recognised.",
        "Ask in writing for responsible people, stages, timescales, criteria and next steps.",
        "Record meetings, commitments, changes of contact and documents received.",
        "Where relevant, request interim measures such as pausing new displays, sampling or publication.",
        "Seek technical, legal, diplomatic and community support as needed, while retaining the authority of those who hold the relationship.",
      ],
    },
    {
      id: "reconnect",
      label: "Reconnect",
      heading: "Imagine what can become possible again",
      intro:
        "Restitution does not end with transport. The community can define what reconnection means and what arrangements for care, access, research or ceremony make sense.",
      points: [
        "Discuss destination, ongoing care, access and long-term responsibilities.",
        "Consider what needs to happen during the process and while what is sought remains far away.",
        "Recognise that ancestors and cultural objects are not interchangeable categories; ancestors are not collection property.",
        "Ask not only what returns, but which relationships, practices, memories and capacities may be restored.",
        "Each people defines its own timeframes, authorities and ways of working; this guide does not propose a universal procedure.",
      ],
    },
  ],
};
