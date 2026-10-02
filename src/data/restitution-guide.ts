export type GuideBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "checklist"; items: string[] }
  | { type: "sequence"; items: string[] };

export interface GuideSection {
  id: string;
  title: string;
  blocks: GuideBlock[];
}

export interface GuideCopy {
  title: string;
  introTitle: string;
  intro: string[];
  startingPoints: { title: string; items: string[]; closing: string };
  heritageContrast: {
    title: string;
    intro: string;
    heritage: { title: string; paragraphs: string[] };
    ancestors: {
      title: string;
      paragraphs: string[];
      questions: string[];
      closing: string;
    };
  };
  movements: { id: string; title: string; question: string }[];
  sections: GuideSection[];
}

export const restitutionGuide: Record<"es" | "en", GuideCopy> = {
  es: {
    title: "Guía MoSA para comenzar un proceso de restitución",
    introTitle: "¿Algo de tu comunidad está lejos?",
    intro: [
      "Quizás hay un nombre, una fotografía o una historia. Quizás sabemos que hay ancestros lejos, pero no dónde. O una búsqueda en el catálogo de un museo acaba de mostrar algo que nunca habíamos visto. Se puede empezar desde ahí.",
      "Esta guía nace en Rapa Nui, de procesos para traer de regreso patrimonio cultural e ivi tupuna (ancestros) separados de su territorio. Comparte preguntas y herramientas que pueden servir en otros lugares sin borrar las autoridades, memorias, relaciones espirituales y conflictos propios de cada pueblo, sin presentar a Rapa Nui como un ejemplo intercambiable ni proponer un método universal.",
      "Los museos suelen presentar la restitución como un procedimiento administrativo: primero el formulario, después la evidencia, la evaluación y, quizás, el retorno. Para MoSA, el proceso comienza antes: con una relación, una ausencia y una historia de separación.",
      "Sabemos que no todo lo que está en un museo salió de la misma manera. Hubo saqueos, excavaciones, intercambios, ventas, regalos y apropiaciones científicas. Pero esas acciones no ocurrieron en un terreno neutral. Ocurrieron dentro de relaciones coloniales atravesadas por violencia, evangelización, jerarquía cultural, desigualdad de recursos y distintas formas de autoridad impuesta.",
      "MoSA usa la palabra ‘robados’ como una posición política frente a esa historia, no como una conclusión jurídica idéntica para todos los casos. Un recibo, una donación o un permiso registrado por una expedición no resuelven por sí solos la pregunta por el consentimiento ni convierten la extracción colonial en un intercambio entre iguales.",
      "La institución conserva inventarios, leyes, órganos de gobierno y documentos que pueden abrir o bloquear un retorno. Conocer ese sistema permite intervenir en él. Pero sus categorías no determinan qué es aquello que se reclama, quién mantiene una relación con ello ni qué significa cuidarlo. La relación viene antes que el expediente.",
    ],
    startingPoints: {
      title: "Para comenzar",
      items: [
        "Anotar qué o quién está lejos y lo que sabemos hasta ahora. Un nombre, una fotografía o un recuerdo ya son información.",
        "Buscar dónde está o preguntar a una institución qué conserva de nuestro territorio o comunidad.",
        "Conversar con quienes tienen relación, responsabilidad o autoridad sobre su cuidado y futuro.",
      ],
      closing: "No hace falta resolver todo antes de dar el primer paso.",
    },
    heritageContrast: {
      title: "Patrimonio cultural y ancestros no son lo mismo",
      intro: "Esta diferencia cambia la ruta.",
      heritage: {
        title: "Patrimonio cultural",
        paragraphs: [
          "Puede ser una figura ceremonial, una escultura, una tablilla, una fotografía, un archivo, una pieza de uso cotidiano u otra entidad cultural que está lejos de la comunidad con la que mantiene una relación.",
          "En Rapa Nui, cuando corresponde, también podemos hablar de ta‘oa desde las relaciones y significados que esa palabra moviliza.",
          "Una entidad cultural puede haber sido desacralizada, convertida en mercancía, souvenir o pieza etnográfica. También puede adquirir nuevas relaciones espirituales, políticas y comunitarias. Su significado no quedó detenido en el momento en que salió.",
          "En estos procesos pueden importar la procedencia, la custodia, la titularidad, las condiciones de adquisición y las vías legales de restitución. Esas categorías sirven para mover el proceso institucional, pero no definen por completo aquello que se reclama.",
        ],
      },
      ancestors: {
        title: "Ancestros",
        paragraphs: [
          "Aquí la ruta cambia. Un ancestro no es un objeto de colección ni una propiedad cultural.",
          "En Rapa Nui, hablar de ivi tupuna devuelve una relación que desaparece cuando una persona queda reducida a “restos”, “material antropológico”, “espécimen” o un número de inventario.",
        ],
        questions: [
          "¿Quién es, o quiénes pueden ser?",
          "¿Con quién mantiene una relación?",
          "¿Quién tiene responsabilidad y autoridad para decidir sobre su cuidado y regreso?",
          "¿Qué debe ocurrir mientras permanece lejos?",
          "No: quién es su dueño.",
        ],
        closing:
          "Esta ruta parte de la dignidad, los derechos de los pueblos indígenas y la autoridad de descendientes y comunidades. La Declaración de las Naciones Unidas sobre los Derechos de los Pueblos Indígenas reconoce el derecho a acceder y repatriar objetos ceremoniales y restos humanos mediante mecanismos construidos junto con los pueblos concernidos.",
      },
    },
    movements: [
      {
        id: "begin",
        title: "COMENZAR",
        question:
          "¿Qué o quién está lejos? ¿Qué relación fue interrumpida? ¿Qué sabemos y qué permanece abierto?",
      },
      {
        id: "translate",
        title: "TRADUCIR",
        question:
          "¿Cómo usamos el sistema institucional sin dejar que sus categorías definan la relación?",
      },
      {
        id: "sustain",
        title: "SOSTENER",
        question:
          "¿Cómo mantenemos el proceso vivo sin entregar el mandato ni aceptar que el diálogo reemplace indefinidamente una decisión?",
      },
      {
        id: "reconnect",
        title: "RECONECTAR",
        question:
          "¿Qué queremos que vuelva a ser posible durante el proceso y después del retorno?",
      },
    ],
    sections: [
      {
        id: "begin",
        title: "1. COMENZAR",
        blocks: [
          { type: "heading", level: 2, text: "Partir de lo que sabemos" },
          {
            type: "paragraph",
            text: "Un nombre, una fotografía, una expedición, un barco, un coleccionista, un libro antiguo o una historia oral pueden abrir la búsqueda.",
          },
          {
            type: "list",
            items: [
              "nombres comunitarios e institucionales",
              "recuerdos y relatos",
              "fechas, lugares y personas relacionadas con la salida",
              "fotografías, cartas, publicaciones y registros",
              "dudas, contradicciones y preguntas abiertas",
            ],
          },
          {
            type: "paragraph",
            text: "El nombre del museo puede ayudar a localizar. No tiene por qué decirnos qué o quién es.",
          },
          {
            type: "heading",
            level: 2,
            text: "Reconocer la relación interrumpida",
          },
          {
            type: "paragraph",
            text: "La relación puede ser ancestral, espiritual, territorial, familiar, ceremonial, cultural o política. Restituir es una manera de recuperar capacidad para recordar, cuidar, practicar, enseñar, nombrar y decidir.",
          },
          {
            type: "heading",
            level: 2,
            text: "Reconocer quiénes necesitan estar",
          },
          {
            type: "paragraph",
            text: "Un proceso puede comenzar con una persona, pero las decisiones pueden involucrar a familias, autoridades, generaciones u organizaciones distintas.",
          },
          {
            type: "list",
            items: [
              "¿Quién mantiene una relación con aquello que está lejos?",
              "¿Quién tiene responsabilidad o autoridad?",
              "¿A quién hay que consultar antes de una decisión importante?",
              "¿Cómo se reconocen los desacuerdos?",
              "¿Quién comunica y quién hace seguimiento?",
            ],
          },
          {
            type: "paragraph",
            text: "No hace falta unificar una “voz de la comunidad” para facilitarle el trabajo a una institución. Rapa Nui tampoco habla con una sola voz. Hay familias, generaciones, conocimientos y posiciones distintas. La pluralidad es parte legítima del proceso y no le quita legitimidad.",
          },
          { type: "heading", level: 2, text: "Acordar lo que no se comparte" },
          {
            type: "paragraph",
            text: "No todo conocimiento debe circular. Puede haber imágenes, nombres, lugares o información espiritual que solo correspondan a determinadas personas.",
          },
          {
            type: "list",
            items: [
              "qué se comparte, con quién y para qué",
              "qué necesita consentimiento adicional",
              "qué puede mostrarse sin ser copiado o publicado",
              "cómo se guardarán los archivos del proceso",
              "qué debe permanecer fuera del expediente institucional",
            ],
          },
          { type: "heading", level: 2, text: "Localizar" },
          {
            type: "paragraph",
            text: "El catálogo permite encontrar, pero también muestra cómo la institución clasificó aquello que retuvo.",
          },
          {
            type: "list",
            items: [
              "la colección de MoSA [LINK A LA COLECCIÓN]",
              "catálogos de museos y universidades",
              "archivos comunitarios, nacionales e institucionales",
              "publicaciones antiguas",
              "diarios y correspondencia de expediciones",
              "registros de coleccionistas",
              "fotografías",
              "bases de datos",
              "memorias familiares y relatos orales",
            ],
          },
          {
            type: "paragraph",
            text: "Sirve probar nombres, traducciones y errores de escritura, además de buscar por territorio, fecha, barco, expedición o coleccionista.",
          },
          {
            type: "list",
            items: [
              "¿Qué conserva la institución de nuestro territorio o comunidad?",
              "¿Qué no aparece en el catálogo público?",
              "¿Qué archivos, fotografías, muestras o datos están asociados?",
              "¿Qué investigación de procedencia ha realizado la institución?",
              "¿Existen inventarios anteriores o materiales sin catalogar?",
            ],
          },
          {
            type: "paragraph",
            text: "La institución poseedora tiene responsabilidad de investigar y abrir sus archivos; la historia de la colección no es una tarea que deba recaer solo en la comunidad.",
          },
          { type: "heading", level: 2, text: "Definir qué se busca ahora" },
          {
            type: "list",
            items: [
              "acceder a información",
              "visitar un depósito",
              "corregir un nombre o una descripción",
              "detener una exhibición o investigación",
              "retirar imágenes",
              "identificar muestras y datos",
              "transferir la titularidad",
              "iniciar una restitución",
              "preparar la repatriación de un ancestro",
            ],
          },
          {
            type: "paragraph",
            text: "Una petición inicial puede ser concreta sin cerrar el resultado final.",
          },
        ],
      },
      {
        id: "translate",
        title: "2. TRADUCIR",
        blocks: [
          {
            type: "paragraph",
            text: "En algún momento aparece el idioma institucional: número de inventario, procedencia, titularidad, baja de colección, órgano de gobierno, licencia de exportación, política de restitución. Traducir es entender qué necesita el sistema para actuar sin permitir que ese sistema defina la relación.",
          },
          { type: "heading", level: 2, text: "Leer la institución" },
          {
            type: "paragraph",
            text: "El museo tiene personas, reglas, jerarquías, intereses y contradicciones. También es parte de un sistema legal más amplio, dependiendo del país o reino al que pertenezca.",
          },
          {
            type: "list",
            items: [
              "¿Qué actores participan?",
              "¿Qué reglas conectan sus decisiones?",
              "¿Qué procedimiento declara seguir?",
              "¿Qué hace realmente?",
              "¿Dónde se bloquea el proceso?",
              "¿Quién puede cambiar una decisión?",
              "¿Qué precedente o excepción existe?",
            ],
          },
          {
            type: "paragraph",
            text: "Esta es una forma de trabajo hacker: conocer el funcionamiento interno de un sistema para encontrar una posibilidad de intervención que no estaba prevista.",
          },
          { type: "heading", level: 2, text: "Identificar quién decide" },
          {
            type: "paragraph",
            text: "La persona que responde un correo puede querer ayudar y no tener autoridad para devolver nada. A veces depende de leyes, política interna o incluso costumbres institucionales.",
          },
          {
            type: "list",
            items: [
              "quién tiene la titularidad",
              "quién mantiene la custodia",
              "quién autoriza una devolución",
              "qué órgano toma la decisión final",
              "qué política, procedimiento o ley se aplica",
              "quién financia la investigación, preparación y transporte",
            ],
          },
          { type: "heading", level: 2, text: "Abrir un primer contacto" },
          {
            type: "paragraph",
            text: "No hace falta comenzar con un expediente largo. Un mensaje breve puede abrir la investigación:",
          },
          {
            type: "quote",
            text: "Somos parte de [comunidad, familia u organización] y estamos investigando [patrimonio cultural / ancestros] relacionado con [territorio].\n\nEncontramos una referencia a [nombre, número o descripción]. Solicitamos la información disponible sobre su procedencia, adquisición, situación actual y documentación asociada, incluidas imágenes, muestras y datos cuando corresponda.\n\nTambién solicitamos el nombre de la persona y del órgano responsables de las decisiones de restitución o repatriación, junto con el procedimiento aplicable.\n\nMientras avanza esta conversación, pedimos que [medida provisional, si corresponde].",
          },
          {
            type: "paragraph",
            text: "Si ya tienes más información puedes seguir el [LINK AL MODELO DE CARTA DE SOLICITUD DE RESTITUCIÓN].",
          },
          { type: "heading", level: 2, text: "Pedir el archivo completo" },
          {
            type: "paragraph",
            text: "Una ficha de catálogo rara vez contiene toda la historia.",
          },
          {
            type: "list",
            items: [
              "registros de adquisición",
              "inventarios anteriores",
              "cartas y diarios de viaje",
              "fotografías",
              "informes de expedición",
              "solicitudes anteriores",
              "estudios científicos",
              "registros de conservación",
              "muestras",
              "escaneos y modelos digitales",
              "datos derivados de investigaciones",
            ],
          },
          {
            type: "paragraph",
            text: "Solicitar estos archivos también restituye conocimiento.",
          },
          { type: "heading", level: 2, text: "Construir una carpeta sencilla" },
          {
            type: "paragraph",
            text: "El caso puede ordenarse en cinco partes.",
          },
          { type: "heading", level: 3, text: "1. Qué o quién se reclama" },
          {
            type: "paragraph",
            text: "Nombres comunitarios e institucionales, descripciones, fotografías y números de inventario.",
          },
          {
            type: "heading",
            level: 3,
            text: "2. Quién escribe y qué relación existe",
          },
          {
            type: "paragraph",
            text: "La relación territorial, ancestral, familiar, ceremonial, espiritual, histórica, cultural o política.",
          },
          { type: "heading", level: 3, text: "3. Qué se sabe" },
          {
            type: "list",
            items: [
              "Esto sabemos.",
              "Esto recuerda la comunidad.",
              "Esto dice la institución.",
              "Esto todavía no está claro.",
            ],
          },
          {
            type: "paragraph",
            text: "Los vacíos documentales son frecuentes en contextos coloniales. No deberían convertirse, por sí solos, en razón para rechazar un retorno.",
          },
          { type: "heading", level: 3, text: "4. Qué se pide ahora" },
          {
            type: "paragraph",
            text: "Información, acceso, una medida provisional, una corrección, transferencia de titularidad, restitución o repatriación.",
          },
          { type: "heading", level: 3, text: "5. Qué debe ocurrir después" },
          {
            type: "paragraph",
            text: "Una fecha de respuesta, una persona responsable y el siguiente paso.",
          },
          { type: "heading", level: 2, text: "Si hablamos de ivi tupuna" },
          {
            type: "paragraph",
            text: "Esta ruta comienza desde otra relación. Las preguntas centrales son:",
          },
          {
            type: "list",
            items: [
              "¿De qué lugar fue extraída esta persona y en qué circunstancias?",
              "¿Existen descendientes, familias o autoridades relacionadas?",
              "¿Dónde está y en qué condiciones?",
              "¿Ha sido exhibida, fotografiada o investigada?",
              "¿Se extrajeron cabello, dientes, tejidos, muestras o material genético?",
              "¿Qué imágenes, análisis y datos existen?",
              "¿Quién conserva y utiliza esos datos?",
              "¿Qué debe detenerse mientras avanza el proceso?",
              "¿Qué formas de cuidado, acceso, privacidad o ceremonia corresponden?",
            ],
          },
          {
            type: "paragraph",
            text: "La investigación de procedencia no autoriza automáticamente nuevos análisis ni la toma de muestras.",
          },
          {
            type: "paragraph",
            text: "Mientras los ancestros permanezcan en una institución, la responsabilidad continúa. Se pueden solicitar medidas como:",
          },
          {
            type: "list",
            items: [
              "retiro de exhibición",
              "suspensión de nuevas imágenes o investigaciones",
              "almacenamiento separado",
              "acceso acordado con la comunidad",
              "identificación de muestras y datos",
              "preparación ceremonial antes del traslado",
            ],
          },
        ],
      },
      {
        id: "sustain",
        title: "3. SOSTENER",
        blocks: [
          { type: "heading", level: 2, text: "Dejar registro" },
          {
            type: "paragraph",
            text: "Fechas, correos, documentos, respuestas, promesas, plazos, gastos y cambios de interlocutor permiten ver dónde se atasca el proceso. Vemos que muchas veces desde los museos la idea del ‘diálogo’ reemplaza indefinidamente las decisiones y acciones que las comunidades solicitan.",
          },
          {
            type: "paragraph",
            text: "Después de una reunión, un resumen breve puede fijar:",
          },
          {
            type: "list",
            items: [
              "qué se acordó",
              "quién hará cada tarea",
              "qué falta",
              "cuál es la próxima fecha",
              "qué medidas provisionales siguen vigentes",
            ],
          },
          { type: "heading", level: 2, text: "Cuando dicen “no”" },
          {
            type: "paragraph",
            text: "Una respuesta institucional puede presentar una decisión política como si fuera una imposibilidad técnica.",
          },
          { type: "heading", level: 3, text: "“La ley no permite devolverlo”" },
          {
            type: "paragraph",
            text: "¿Qué ley? ¿Qué disposición concreta? ¿Quién la interpreta? ¿Qué impide exactamente? ¿Existen excepciones o precedentes?",
          },
          { type: "heading", level: 3, text: "“No hay suficiente evidencia”" },
          {
            type: "paragraph",
            text: "¿Qué consideran evidencia? ¿Qué investigó la institución? ¿Cómo incorporó la memoria oral y el conocimiento tradicional? ¿Qué falta exactamente? La falta de documentos puede ser parte de la historia colonial del caso, no una falla de la comunidad.",
          },
          {
            type: "heading",
            level: 3,
            text: "“No tienen condiciones adecuadas para cuidarlo”",
          },
          {
            type: "paragraph",
            text: "¿Quién definió esas condiciones? ¿Son un requisito legal? ¿Se aplican del mismo modo a la propia institución? La pregunta de fondo sigue siendo quién tiene autoridad para decidir qué significa cuidar.",
          },
          { type: "heading", level: 3, text: "“Podemos ofrecer un préstamo”" },
          {
            type: "paragraph",
            text: "Un préstamo puede abrir acceso, pero mantiene la propiedad y la decisión en la institución. Puede funcionar como una medida temporal. No debería presentarse como restitución ni utilizarse para reemplazarla.",
          },
          { type: "heading", level: 3, text: "No contestan" },
          {
            type: "paragraph",
            text: "Un nuevo mensaje con una fecha concreta, el contacto del órgano de gobierno, la política institucional, una solicitud de acceso a información o la conexión con otras comunidades pueden mover el proceso. El silencio también muestra dónde está el poder.",
          },
          {
            type: "heading",
            level: 2,
            text: "Construir alianzas sin perder el mandato",
          },
          {
            type: "paragraph",
            text: "Otras comunidades, redes indígenas, investigadores, juristas, traductores, artistas, periodistas o personas dentro de museos pueden acompañar. Existe un movimiento cada vez más visible en torno a la restitución y MoSA busca conectar estas fuerzas; puedes buscar aliados en [LINK AL DIRECTORIO DE ORGANIZACIONES].",
          },
          {
            type: "paragraph",
            text: "Es importante que la decisión siempre siga en manos de quienes tienen relación, responsabilidad y autoridad sobre el proceso.",
          },
          {
            type: "heading",
            level: 2,
            text: "No congelar la relación mientras llega el retorno",
          },
          {
            type: "paragraph",
            text: "Un proceso puede tardar años. Durante ese tiempo también pueden recuperarse conocimientos y memorias que forman parte del proceso de reconexión:",
          },
          {
            type: "list",
            items: [
              "archivos",
              "fotografías",
              "nombres",
              "acceso",
              "encuentros",
              "conocimiento",
              "capacidad de decisión",
              "conversaciones entre generaciones",
            ],
          },
        ],
      },
      {
        id: "reconnect",
        title: "4. RECONECTAR",
        blocks: [
          {
            type: "paragraph",
            text: "La institución hablará de embalaje, seguros, permisos, aduanas y conservación. También hay otras preguntas:",
          },
          {
            type: "list",
            items: [
              "¿Quién recibe y dónde?",
              "¿Qué ceremonia corresponde antes, durante y después del viaje?",
              "¿Quién puede estar presente?",
              "¿Qué puede documentarse?",
              "¿Qué debe permanecer privado?",
              "¿Cómo participan distintas generaciones?",
              "¿Quién decide qué ocurre después?",
            ],
          },
          {
            type: "heading",
            level: 2,
            text: "Que vuelva también el conocimiento que se ha acumulado desde la institución",
          },
          { type: "paragraph", text: "El retorno puede incluir:" },
          {
            type: "list",
            items: [
              "expedientes",
              "correspondencia",
              "fotografías",
              "escaneos",
              "investigaciones",
              "registros de conservación",
              "datos",
              "muestras",
              "derechos de reproducción",
            ],
          },
          { type: "heading", level: 2, text: "El retorno abre otra etapa" },
          {
            type: "paragraph",
            text: "El regreso no recupera un pasado intacto.",
          },
          {
            type: "paragraph",
            text: "Puede volver una práctica, un nombre, una técnica, una historia, una relación espiritual o una conversación entre generaciones. También pueden aparecer desacuerdos y preguntas nuevas.",
          },
          {
            type: "sequence",
            items: ["RETORNO", "RECONECTAR", "CUIDAR", "TRANSMITIR"],
          },
          {
            type: "paragraph",
            text: "La pregunta del retorno es qué vuelve a ser posible en una comunidad y territorio con esa entidad de vuelta, no solo cómo vuelve.",
          },
        ],
      },
      {
        id: "before-sending",
        title: "Antes de enviar",
        blocks: [
          {
            type: "checklist",
            items: [
              "¿Está claro qué o quién se reclama?",
              "¿La carta usa los nombres y relaciones que reconoce la comunidad?",
              "¿Participaron quienes tienen responsabilidad o autoridad?",
              "¿Está protegido el conocimiento que no debe circular?",
              "¿Sabemos quién custodia, quién tiene la titularidad y quién decide?",
              "¿Separamos lo conocido, la memoria comunitaria, la versión institucional y las dudas?",
              "¿La petición y el siguiente paso son concretos?",
              "¿Pedimos los archivos, muestras y datos asociados?",
              "¿Hay medidas provisionales que solicitar?",
              "¿Está definido el seguimiento?",
            ],
          },
          {
            type: "paragraph",
            text: "Si se trata de un ancestro: ¿La carta habla de una persona, de su dignidad y sus relaciones, o repite el lenguaje que la convirtió en colección?",
          },
        ],
      },
      {
        id: "origins",
        title: "De dónde nace esta guía",
        blocks: [
          {
            type: "paragraph",
            text: "Esta guía forma parte de una genealogía de experiencias en torno a la restitución en Rapa Nui y otros territorios. No propone que todos los pueblos recorran el mismo camino. Lo que puede viajar son herramientas para buscar, preguntar, proteger conocimiento, leer una institución, identificar dónde está el poder, responder a un bloqueo y mantener la relación propia en el centro.",
          },
          {
            type: "paragraph",
            text: "Lo que no puede generalizarse pertenece a cada territorio: la autoridad, el linaje, la memoria, las relaciones espirituales, las formas de cuidado y la historia concreta de la separación. La restitución permite afirmar que los museos, las relaciones y las formas de producir conocimiento pueden construirse de otra manera.",
          },
          { type: "paragraph", text: "Con la sabia colaboración de:" },
          {
            type: "list",
            items: ["Leonardo Pakarati", "Paula Rossetti", "Mario Amahiro Tuki", "Amber Aranui"],
          },
        ],
      },
      {
        id: "frameworks",
        title: "Marcos y referentes",
        blocks: [
          {
            type: "paragraph",
            text: "No existe una única ley que resuelva todos los procesos. La vía depende de qué o quién se reclama, cuándo y cómo salió, dónde se encuentra, qué institución lo custodia y qué normas se aplican.",
          },
          {
            type: "paragraph",
            text: "La Convención UNESCO de 1970 sirve para determinados casos de bienes culturales, pero no cubre automáticamente los desplazamientos coloniales ni ofrece por sí sola una ruta general para ancestros.",
          },
          {
            type: "paragraph",
            text: "La Declaración de las Naciones Unidas sobre los Derechos de los Pueblos Indígenas ofrece un marco central para el patrimonio cultural y espiritual, los objetos ceremoniales y la repatriación de restos humanos.",
          },
          {
            type: "paragraph",
            text: "Las normas profesionales y políticas institucionales pueden abrir posibilidades, pero no reemplazan los derechos, la autoridad comunitaria ni las leyes aplicables a cada caso.",
          },
          {
            type: "paragraph",
            text: "Esta guía pone los procesos y aprendizajes de Rapa Nui en conversación con:",
          },
          {
            type: "list",
            items: [
              "Association on American Indian Affairs, *A Guide to International Repatriation*.",
              "Declaración de las Naciones Unidas sobre los Derechos de los Pueblos Indígenas, especialmente artículos 11 y 12.",
              "UNESCO, Convención de 1970 y sus Directrices Operativas.",
              "UMAC/ICOM, *Guidance for Restitution and Return of Items from University Museums and Collections*.",
              "Arts Council England e Institute of Art and Law, *Restitution and Repatriation*.",
              "*Joint Guidelines for Dealing with Cultural Property and Human Remains from Colonial Contexts*.",
              "ICOM, *Código de Ética para los Museos*.",
              "Museo de Rapa Nui y Programa Ka Haka Hoki Mai Te Mana Tupuna.",
            ],
          },
        ],
      },
    ],
  },
  en: {
    title: "MoSA Guide to Starting a Restitution Process",
    introTitle: "Is something from your community far away?",
    intro: [
      "Perhaps there is a name, a photograph, or a story. Perhaps we know that there are ancestors far away, but not where. Or a search in a museum catalogue has just revealed something we had never seen before. We can begin there.",
      "This guide emerged in Rapa Nui, from processes to bring back cultural heritage and ivi tupuna (ancestors) separated from their territory. It shares questions and tools that may be useful elsewhere without erasing the authorities, memories, spiritual relationships, and conflicts specific to each people, without presenting Rapa Nui as an interchangeable example or proposing a universal method.",
      "Museums often present restitution as an administrative procedure: first the form, then the evidence, the assessment, and perhaps the return. For MoSA, the process begins earlier: with a relationship, an absence, and a history of separation.",
      "We know that not everything held in a museum left in the same way. There were lootings, excavations, exchanges, sales, gifts, and scientific appropriations. But these actions did not take place on neutral ground. They occurred within colonial relations shaped by violence, evangelisation, cultural hierarchy, unequal resources, and different forms of imposed authority.",
      "MoSA uses the word ‘stolen’ as a political position in relation to this history, not as an identical legal conclusion for every case. A receipt, a donation, or a permit recorded by an expedition does not in itself resolve the question of consent or turn colonial extraction into an exchange between equals.",
      "The institution holds inventories, laws, governing bodies, and documents that can enable or block a return. Understanding that system makes it possible to intervene in it. But its categories do not determine what or who is being claimed, who maintains a relationship with them, or what it means to care for them. The relationship comes before the case file.",
    ],
    startingPoints: {
      title: "To begin",
      items: [
        "Write down what or who is far away and what we know so far. A name, a photograph, or a memory is already information.",
        "Search for where they are or ask an institution what it holds from our territory or community.",
        "Speak with those who have a relationship, responsibility, or authority over their care and future.",
      ],
      closing: "Everything does not need to be resolved before taking the first step.",
    },
    heritageContrast: {
      title: "Cultural heritage and ancestors are not the same",
      intro: "This difference changes the route.",
      heritage: {
        title: "Cultural heritage",
        paragraphs: [
          "It may be a ceremonial figure, a sculpture, a tablet, a photograph, an archive, an everyday item, or another cultural entity that is far from the community with which it maintains a relationship.",
          "In Rapa Nui, where appropriate, we can also speak of ta‘oa through the relationships and meanings that this word mobilises.",
          "A cultural entity may have been desacralised, turned into a commodity, souvenir, or ethnographic piece. It may also acquire new spiritual, political, and community relationships. Its meaning did not stop at the moment it left.",
          "In these processes, provenance, custody, legal title, acquisition conditions, and legal avenues for restitution may matter. These categories help move the institutional process, but they do not fully define what is being claimed.",
        ],
      },
      ancestors: {
        title: "Ancestors",
        paragraphs: [
          "Here the route changes. An ancestor is not a collection object or cultural property.",
          "In Rapa Nui, speaking of ivi tupuna restores a relationship that disappears when a person is reduced to “remains”, “anthropological material”, a “specimen”, or an inventory number.",
        ],
        questions: [
          "Who are they, or who might they be?",
          "With whom do they maintain a relationship?",
          "Who has the responsibility and authority to decide about their care and return?",
          "What must happen while they remain far away?",
          "Not: who owns them.",
        ],
        closing:
          "This route begins from dignity, the rights of Indigenous Peoples, and the authority of descendants and communities. The United Nations Declaration on the Rights of Indigenous Peoples recognises the right to access and repatriate ceremonial objects and human remains through mechanisms developed together with the peoples concerned.",
      },
    },
    movements: [
      {
        id: "begin",
        title: "BEGIN",
        question:
          "What or who is far away? What relationship was interrupted? What do we know and what remains open?",
      },
      {
        id: "translate",
        title: "TRANSLATE",
        question:
          "How do we use the institutional system without allowing its categories to define the relationship?",
      },
      {
        id: "sustain",
        title: "SUSTAIN",
        question:
          "How do we keep the process alive without surrendering the mandate or accepting that dialogue indefinitely replaces a decision?",
      },
      {
        id: "reconnect",
        title: "RECONNECT",
        question:
          "What do we want to become possible again during the process and after the return?",
      },
    ],
    sections: [
      {
        id: "begin",
        title: "1. BEGIN",
        blocks: [
          { type: "heading", level: 2, text: "Start from what we know" },
          {
            type: "paragraph",
            text: "A name, a photograph, an expedition, a ship, a collector, an old book, or an oral history can open the search.",
          },
          {
            type: "list",
            items: [
              "community and institutional names",
              "memories and accounts",
              "dates, places, and people connected to the removal",
              "photographs, letters, publications, and records",
              "doubts, contradictions, and open questions",
            ],
          },
          {
            type: "paragraph",
            text: "The museum’s name may help us locate them. It does not have to tell us what or who they are.",
          },
          {
            type: "heading",
            level: 2,
            text: "Recognise the interrupted relationship",
          },
          {
            type: "paragraph",
            text: "The relationship may be ancestral, spiritual, territorial, familial, ceremonial, cultural, or political. Restitution is a way of recovering the capacity to remember, care, practise, teach, name, and decide.",
          },
          {
            type: "heading",
            level: 2,
            text: "Recognise who needs to be involved",
          },
          {
            type: "paragraph",
            text: "A process may begin with one person, but decisions may involve different families, authorities, generations, or organisations.",
          },
          {
            type: "list",
            items: [
              "Who maintains a relationship with what or who is far away?",
              "Who has responsibility or authority?",
              "Who must be consulted before an important decision?",
              "How are disagreements recognised?",
              "Who communicates and who follows up?",
            ],
          },
          {
            type: "paragraph",
            text: "There is no need to unify a “community voice” to make an institution’s work easier. Rapa Nui does not speak with a single voice either. There are different families, generations, forms of knowledge, and positions. Plurality is a legitimate part of the process and does not diminish its legitimacy.",
          },
          { type: "heading", level: 2, text: "Agree on what is not shared" },
          {
            type: "paragraph",
            text: "Not all knowledge should circulate. There may be images, names, places, or spiritual information that belong only to certain people.",
          },
          {
            type: "list",
            items: [
              "what is shared, with whom, and for what purpose",
              "what requires additional consent",
              "what may be shown without being copied or published",
              "how the process archives will be stored",
              "what must remain outside the institutional case file",
            ],
          },
          { type: "heading", level: 2, text: "Locate" },
          {
            type: "paragraph",
            text: "The catalogue makes it possible to find, but it also shows how the institution classified what it retained.",
          },
          {
            type: "list",
            items: [
              "the MoSA collection [LINK TO THE COLLECTION]",
              "museum and university catalogues",
              "community, national, and institutional archives",
              "old publications",
              "expedition journals and correspondence",
              "collectors’ records",
              "photographs",
              "databases",
              "family memories and oral histories",
            ],
          },
          {
            type: "paragraph",
            text: "It is useful to try names, translations, and spelling errors, as well as searching by territory, date, ship, expedition, or collector.",
          },
          {
            type: "list",
            items: [
              "What does the institution hold from our territory or community?",
              "What does not appear in the public catalogue?",
              "What archives, photographs, samples, or data are associated with it?",
              "What provenance research has the institution carried out?",
              "Are there earlier inventories or uncatalogued materials?",
            ],
          },
          {
            type: "paragraph",
            text: "The holding institution has a responsibility to investigate and open its archives. The history of the collection is not a task that should fall solely on the community.",
          },
          {
            type: "heading",
            level: 2,
            text: "Define what is being sought now",
          },
          {
            type: "list",
            items: [
              "accessing information",
              "visiting a storage facility",
              "correcting a name or description",
              "stopping an exhibition or research",
              "removing images",
              "identifying samples and data",
              "transferring legal title",
              "initiating restitution",
              "preparing the repatriation of an ancestor",
            ],
          },
          {
            type: "paragraph",
            text: "An initial request can be concrete without closing off the final outcome.",
          },
        ],
      },
      {
        id: "translate",
        title: "2. TRANSLATE",
        blocks: [
          {
            type: "paragraph",
            text: "At some point, institutional language appears: inventory number, provenance, legal title, deaccessioning, governing body, export licence, restitution policy. Translating means understanding what the system needs in order to act without allowing that system to define the relationship.",
          },
          { type: "heading", level: 2, text: "Read the institution" },
          {
            type: "paragraph",
            text: "The museum has people, rules, hierarchies, interests, and contradictions. It is also part of a broader legal system, depending on the country or kingdom to which it belongs.",
          },
          {
            type: "list",
            items: [
              "What actors are involved?",
              "What rules connect their decisions?",
              "What procedure does it claim to follow?",
              "What does it actually do?",
              "Where does the process become blocked?",
              "Who can change a decision?",
              "What precedent or exception exists?",
            ],
          },
          {
            type: "paragraph",
            text: "This is a form of hacker work: understanding the internal workings of a system in order to find a possibility for intervention that was not anticipated.",
          },
          { type: "heading", level: 2, text: "Identify who decides" },
          {
            type: "paragraph",
            text: "The person answering an email may want to help but have no authority to return anything. Sometimes the decision depends on laws, internal policy, or even institutional customs.",
          },
          {
            type: "list",
            items: [
              "who holds legal title",
              "who maintains custody",
              "who authorises a return",
              "which body makes the final decision",
              "which policy, procedure, or law applies",
              "who funds the research, preparation, and transport",
            ],
          },
          { type: "heading", level: 2, text: "Open a first contact" },
          {
            type: "paragraph",
            text: "There is no need to begin with a long case file. A short message can open the investigation:",
          },
          {
            type: "quote",
            text: "We are part of [community, family, or organisation] and are researching [cultural heritage / ancestors] connected to [territory].\n\nWe found a reference to [name, number, or description]. We request all available information about its provenance, acquisition, current status, and associated documentation, including images, samples, and data where relevant.\n\nWe also request the name of the person and governing body responsible for restitution or repatriation decisions, together with the applicable procedure.\n\nWhile this conversation moves forward, we ask that [interim measure, where relevant].",
          },
          {
            type: "paragraph",
            text: "If you already have more information, you can follow the [LINK TO THE RESTITUTION REQUEST LETTER TEMPLATE].",
          },
          { type: "heading", level: 2, text: "Request the complete archive" },
          {
            type: "paragraph",
            text: "A catalogue record rarely contains the whole history. There may be:",
          },
          {
            type: "list",
            items: [
              "acquisition records",
              "earlier inventories",
              "travel letters and journals",
              "photographs",
              "expedition reports",
              "previous requests",
              "scientific studies",
              "conservation records",
              "samples",
              "scans and digital models",
              "data derived from research",
            ],
          },
          {
            type: "paragraph",
            text: "Requesting these archives also restores knowledge.",
          },
          { type: "heading", level: 2, text: "Build a simple folder" },
          {
            type: "paragraph",
            text: "The case can be organised into five parts.",
          },
          {
            type: "heading",
            level: 3,
            text: "1. What or who is being claimed",
          },
          {
            type: "paragraph",
            text: "Community and institutional names, descriptions, photographs, and inventory numbers.",
          },
          {
            type: "heading",
            level: 3,
            text: "2. Who is writing and what relationship exists",
          },
          {
            type: "paragraph",
            text: "The territorial, ancestral, familial, ceremonial, spiritual, historical, cultural, or political relationship.",
          },
          { type: "heading", level: 3, text: "3. What is known" },
          {
            type: "list",
            items: [
              "This is what we know.",
              "This is what the community remembers.",
              "This is what the institution says.",
              "This is what is still unclear.",
            ],
          },
          {
            type: "paragraph",
            text: "Documentary gaps are common in colonial contexts. They should not, in themselves, become a reason to reject a return.",
          },
          { type: "heading", level: 3, text: "4. What is being requested now" },
          {
            type: "paragraph",
            text: "Information, access, an interim measure, a correction, transfer of legal title, restitution, or repatriation.",
          },
          { type: "heading", level: 3, text: "5. What must happen next" },
          {
            type: "paragraph",
            text: "A response date, a responsible person, and the next step.",
          },
          {
            type: "heading",
            level: 2,
            text: "If we are speaking about ivi tupuna",
          },
          {
            type: "paragraph",
            text: "This route begins from another relationship. The central questions are:",
          },
          {
            type: "list",
            items: [
              "From what place was this person removed, and under what circumstances?",
              "Are there related descendants, families, or authorities?",
              "Where are they and under what conditions?",
              "Have they been exhibited, photographed, or researched?",
              "Were hair, teeth, tissues, samples, or genetic material removed?",
              "What images, analyses, and data exist?",
              "Who holds and uses those data?",
              "What must stop while the process moves forward?",
              "What forms of care, access, privacy, or ceremony are appropriate?",
            ],
          },
          {
            type: "paragraph",
            text: "Provenance research does not automatically authorise new analyses or the taking of samples.",
          },
          {
            type: "paragraph",
            text: "While ancestors remain in an institution, responsibility continues. Measures may be requested such as:",
          },
          {
            type: "list",
            items: [
              "removal from display",
              "suspension of new images or research",
              "separate storage",
              "access agreed with the community",
              "identification of samples and data",
              "ceremonial preparation before transfer",
            ],
          },
        ],
      },
      {
        id: "sustain",
        title: "3. SUSTAIN",
        blocks: [
          { type: "heading", level: 2, text: "Keep a record" },
          {
            type: "paragraph",
            text: "Dates, emails, documents, responses, promises, deadlines, expenses, and changes of contact person make it possible to see where the process becomes stuck. We see that museums often use the idea of “dialogue” to indefinitely replace the decisions and actions requested by communities.",
          },
          {
            type: "paragraph",
            text: "After a meeting, a short summary can establish:",
          },
          {
            type: "list",
            items: [
              "what was agreed",
              "who will carry out each task",
              "what remains outstanding",
              "the next date",
              "which interim measures remain in force",
            ],
          },
          { type: "heading", level: 2, text: "When they say “no”" },
          {
            type: "paragraph",
            text: "An institutional response may present a political decision as though it were a technical impossibility.",
          },
          {
            type: "heading",
            level: 3,
            text: "“The law does not allow us to return it”",
          },
          {
            type: "paragraph",
            text: "Which law? Which specific provision? Who interprets it? What exactly does it prevent? Are there exceptions or precedents?",
          },
          { type: "heading", level: 3, text: "“There is not enough evidence”" },
          {
            type: "paragraph",
            text: "What do they consider evidence? What did the institution investigate? How did it incorporate oral memory and traditional knowledge? What exactly is missing? The absence of documents may be part of the colonial history of the case, not a failure of the community.",
          },
          {
            type: "heading",
            level: 3,
            text: "“You do not have suitable conditions to care for it”",
          },
          {
            type: "paragraph",
            text: "Who defined those conditions? Are they a legal requirement? Are they applied in the same way to the institution itself? The underlying question remains who has the authority to decide what care means.",
          },
          { type: "heading", level: 3, text: "“We can offer a loan”" },
          {
            type: "paragraph",
            text: "A loan may open access, but it keeps ownership and decision-making within the institution. It may function as a temporary measure. It should not be presented as restitution or used to replace it.",
          },
          { type: "heading", level: 3, text: "They do not respond" },
          {
            type: "paragraph",
            text: "A new message with a specific date, the contact details of the governing body, the institutional policy, a request for access to information, or a connection with other communities may move the process forward. Silence also reveals where power lies.",
          },
          {
            type: "heading",
            level: 2,
            text: "Build alliances without losing the mandate",
          },
          {
            type: "paragraph",
            text: "Other communities, Indigenous networks, researchers, lawyers, translators, artists, journalists, or people within museums may accompany the process. There is an increasingly visible movement around restitution, and MoSA seeks to connect these forces. You can look for allies in [LINK TO DIRECTORY OF ORGANISATIONS].",
          },
          {
            type: "paragraph",
            text: "It is important that the decision always remains in the hands of those who have a relationship, responsibility, and authority over the process.",
          },
          {
            type: "heading",
            level: 2,
            text: "Do not freeze the relationship while waiting for the return",
          },
          {
            type: "paragraph",
            text: "A process can take years. During that time, knowledge and memories that form part of the reconnection process can also be recovered:",
          },
          {
            type: "list",
            items: [
              "archives",
              "photographs",
              "names",
              "access",
              "encounters",
              "knowledge",
              "decision-making capacity",
              "conversations between generations",
            ],
          },
        ],
      },
      {
        id: "reconnect",
        title: "4. RECONNECT",
        blocks: [
          {
            type: "paragraph",
            text: "The institution will speak about packing, insurance, permits, customs, and conservation. There are also other questions:",
          },
          {
            type: "list",
            items: [
              "Who receives them and where?",
              "What ceremony is appropriate before, during, and after the journey?",
              "Who may be present?",
              "What may be documented?",
              "What must remain private?",
              "How do different generations participate?",
              "Who decides what happens next?",
            ],
          },
          {
            type: "heading",
            level: 2,
            text: "The knowledge accumulated by the institution must also return",
          },
          { type: "paragraph", text: "The return may include:" },
          {
            type: "list",
            items: [
              "case files",
              "correspondence",
              "photographs",
              "scans",
              "research",
              "conservation records",
              "data",
              "samples",
              "reproduction rights",
            ],
          },
          { type: "heading", level: 2, text: "The return opens another stage" },
          {
            type: "paragraph",
            text: "The return does not recover an intact past.",
          },
          {
            type: "paragraph",
            text: "A practice, a name, a technique, a story, a spiritual relationship, or a conversation between generations may return. Disagreements and new questions may also emerge.",
          },
          {
            type: "sequence",
            items: ["RETURN", "RECONNECT", "CARE", "TRANSMIT"],
          },
          {
            type: "paragraph",
            text: "The question of return is what becomes possible again in a community and territory with that entity back, not only how it returns.",
          },
        ],
      },
      {
        id: "before-sending",
        title: "Before sending",
        blocks: [
          {
            type: "checklist",
            items: [
              "Is it clear what or who is being claimed?",
              "Does the letter use the names and relationships recognised by the community?",
              "Did those who have responsibility or authority participate?",
              "Is knowledge that should not circulate protected?",
              "Do we know who has custody, who holds legal title, and who decides?",
              "Have we separated what is known, community memory, the institutional version, and doubts?",
              "Are the request and the next step concrete?",
              "Did we request the associated archives, samples, and data?",
              "Are there interim measures that should be requested?",
              "Has follow-up been defined?",
            ],
          },
          {
            type: "paragraph",
            text: "If this concerns an ancestor: Does the letter speak of a person, their dignity, and their relationships, or does it repeat the language that turned them into a collection?",
          },
        ],
      },
      {
        id: "origins",
        title: "Where this guide comes from",
        blocks: [
          {
            type: "paragraph",
            text: "This guide forms part of a genealogy of experiences around restitution in Rapa Nui and other territories. It does not propose that all peoples follow the same path. What can travel are tools for searching, asking questions, protecting knowledge, reading an institution, identifying where power lies, responding to an obstruction, and keeping one’s own relationship at the centre.",
          },
          {
            type: "paragraph",
            text: "What cannot be generalised belongs to each territory: authority, lineage, memory, spiritual relationships, forms of care, and the specific history of separation. Restitution makes it possible to affirm that museums, relationships, and ways of producing knowledge can be constructed differently.",
          },
          { type: "paragraph", text: "With the wise collaboration of:" },
          {
            type: "list",
            items: ["Leonardo Pakarati", "Paula Rossetti", "Mario Amahiro Tuki", "Amber Aranui"],
          },
        ],
      },
      {
        id: "frameworks",
        title: "Frameworks and reference figures",
        blocks: [
          {
            type: "paragraph",
            text: "There is no single law that resolves every process. The route depends on what or who is being claimed, when and how they left, where they are located, which institution holds them, and which rules apply.",
          },
          {
            type: "paragraph",
            text: "The 1970 UNESCO Convention applies to certain cases involving cultural property, but it does not automatically cover colonial displacements or provide, in itself, a general route for ancestors.",
          },
          {
            type: "paragraph",
            text: "The United Nations Declaration on the Rights of Indigenous Peoples provides a central framework for cultural and spiritual heritage, ceremonial objects, and the repatriation of human remains.",
          },
          {
            type: "paragraph",
            text: "Professional standards and institutional policies may open possibilities, but they do not replace rights, community authority, or the laws applicable to each case.",
          },
          {
            type: "paragraph",
            text: "This guide places the processes and lessons of Rapa Nui in conversation with:",
          },
          {
            type: "list",
            items: [
              "Association on American Indian Affairs, *A Guide to International Repatriation*.",
              "United Nations Declaration on the Rights of Indigenous Peoples, especially Articles 11 and 12.",
              "UNESCO, 1970 Convention and its Operational Guidelines.",
              "UMAC/ICOM, *Guidance for Restitution and Return of Items from University Museums and Collections*.",
              "Arts Council England and Institute of Art and Law, *Restitution and Repatriation*.",
              "*Joint Guidelines for Dealing with Cultural Property and Human Remains from Colonial Contexts*.",
              "ICOM, *Code of Ethics for Museums*.",
              "Rapa Nui Museum and the Ka Haka Hoki Mai Te Mana Tupuna Programme.",
            ],
          },
        ],
      },
    ],
  },
};
