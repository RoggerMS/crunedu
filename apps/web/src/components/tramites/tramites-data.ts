export type TramiteCategory =
  | "matricula"
  | "carnet"
  | "constancias"
  | "comedor"
  | "biblioteca"
  | "mesa-partes"
  | "becas"
  | "orientacion";

export type Tramite = {
  id: string;
  title: string;
  category: TramiteCategory;
  description: string;
  icon: string;
  steps: string[];
  documents: string[];
  area: string;
  schedule: string;
  location: string;
  warning: string;
};

export const TRAMITES: Tramite[] = [
  {
    id: "matricula",
    title: "Matrícula",
    category: "matricula",
    description:
      "Proceso de matrícula regular y extemporánea para estudiantes de la Universidad Nacional de Educación Enrique Guzmán y Valle.",
    icon: "📋",
    steps: [
      "Revisa la convocatoria de matrícula publicada por Secretaría Académica.",
      "Ingresa al sistema de matrícula con tu código de estudiante.",
      "Selecciona los cursos disponibles según tu plan de estudios.",
      "Imprime tu ficha de matrícula y verifica los datos.",
      "Realiza el pago correspondiente en Tesorería si aplica.",
      "Presenta tu ficha sellada en Secretaría Académica para su validación.",
    ],
    documents: [
      "Ficha de matrícula impresa",
      "Recibo de pago (si aplica)",
      "DNI o carné universitario",
      "Constancia de haber cursado el ciclo anterior (si aplica)",
    ],
    area: "Secretaría Académica",
    schedule: "Lun-Vie 8:00 a.m. - 5:00 p.m.",
    location: "Pabellón A, primer piso",
    warning:
      "Las fechas exactas y requisitos pueden variar cada ciclo. Verifica siempre la información oficial publicada por la universidad antes de iniciar el trámite.",
  },
  {
    id: "carnet-universitario",
    title: "Carné Universitario",
    category: "carnet",
    description:
      "Obtén o renueva tu carné universitario, documento oficial que te identifica como estudiante de La Cantuta.",
    icon: "🪪",
    steps: [
      "Solicita tu carné al inicio del ciclo académico.",
      "Completa el formulario de registro con tus datos personales.",
      "Adjunta una foto tamaño carné con fondo blanco.",
      "Espera la validación de datos por parte de la universidad.",
      "Recoge tu carné en la oficina indicada (generalmente Secretaría o Bienestar Universitario).",
    ],
    documents: [
      "DNI original y copia",
      "Foto tamaño carné",
      "Constancia de matrícula",
      "Comprobante de pago del carné",
    ],
    area: "Bienestar Universitario / Secretaría Académica",
    schedule: "Lun-Vie 8:30 a.m. - 4:30 p.m.",
    location: "Edificio de Bienestar Universitario",
    warning:
      "El carné universitario es personal e intransferible. Su pérdida debe ser reportada inmediatamente. Los costos y plazos pueden variar cada año.",
  },
  {
    id: "constancias",
    title: "Constancias de Estudio",
    category: "constancias",
    description:
      "Solicita constancias de estudios, notas, matrícula libre o egreso para trámites personales o académicos.",
    icon: "📜",
    steps: [
      "Redacta una solicitud dirigida a Secretaría Académica indicando el tipo de constancia que necesitas.",
      "Adjunta los documentos requeridos según el tipo de constancia.",
      "Realiza el pago del derecho de trámite en Tesorería.",
      "Presenta tu solicitud en Mesa de Partes.",
      "Espera el tiempo de atención (generalmente 3 a 7 días hábiles).",
      "Recoge tu constancia en la fecha indicada.",
    ],
    documents: [
      "Solicitud escrita dirigida a Secretaría Académica",
      "Copia del DNI",
      "Copia del carné universitario",
      "Recibo de pago del derecho de trámite",
      "Constancia de matrícula (para constancias de estudios)",
    ],
    area: "Secretaría Académica",
    schedule: "Lun-Vie 8:00 a.m. - 5:00 p.m.",
    location: "Pabellón A, primer piso",
    warning:
      "Los plazos de atención pueden extenderse en épocas de alta demanda (inicio y final de ciclo). Solicita tu constancia con anticipación.",
  },
  {
    id: "comedor-universitario",
    title: "Comedor Universitario",
    category: "comedor",
    description:
      "Accede al servicio de alimentación del comedor universitario para estudiantes de La Cantuta.",
    icon: "🍽️",
    steps: [
      "Verifica si eres beneficiario del programa de alimentación (generalmente por condición socioeconómica).",
      "Inscríbete en Bienestar Universitario al inicio del ciclo.",
      "Presenta los documentos requeridos.",
      "Recibe tu credencial de acceso al comedor.",
      "Consulta los horarios de atención y el menú diario.",
    ],
    documents: [
      "Solicitud de inscripción al comedor",
      "Copia del DNI",
      "Copia del carné universitario",
      "Ficha socioeconómica (si aplica)",
      "Constancia de matrícula",
    ],
    area: "Bienestar Universitario",
    schedule: "Atención al público: Lun-Vie 8:30 a.m. - 4:30 p.m.",
    location: "Edificio de Bienestar Universitario",
    warning:
      "El cupo del comedor es limitado. Inscríbete temprano en cada ciclo. Los horarios y menús pueden cambiar sin previo aviso.",
  },
  {
    id: "biblioteca",
    title: "Biblioteca Central",
    category: "biblioteca",
    description:
      "Accede a los servicios de la Biblioteca Central: préstamo de libros, sala de lectura, recursos digitales y más.",
    icon: "📚",
    steps: [
      "Regístrate en la Biblioteca presentando tu carné universitario.",
      "Revisa el catálogo disponible (físico o en línea).",
      "Solicita el material en la ventanilla de atención.",
      "Para préstamo a domicilio, presenta tu carné y completa la ficha.",
      "Devuelve los materiales en la fecha indicada para evitar multas.",
    ],
    documents: [
      "Carné universitario vigente",
      "DNI (para registro inicial)",
    ],
    area: "Biblioteca Central",
    schedule: "Lun-Sáb 8:00 a.m. - 8:00 p.m.",
    location: "Biblioteca Central, campus principal",
    warning:
      "Los libros en sala de lectura no pueden salir de la biblioteca. El préstamo a domicilio tiene límite de días y la devolución tardía genera multas.",
  },
  {
    id: "mesa-de-partes",
    title: "Mesa de Partes",
    category: "mesa-partes",
    description:
      "Presenta documentos y solicitudes oficiales dirigidas a las diferentes dependencias de la universidad.",
    icon: "📩",
    steps: [
      "Redacta tu solicitud o documento según el formato requerido.",
      "Adjunta todos los documentos sustentatorios.",
      "Acércate a la Mesa de Partes en horario de atención.",
      "Registra tu expediente y recibe el número de seguimiento.",
      "Realiza el seguimiento de tu trámite con el número asignado.",
    ],
    documents: [
      "Solicitud escrita",
      "Documentos sustentatorios",
      "Copia del DNI",
      "Recibo de pago si el trámite tiene costo",
    ],
    area: "Mesa de Partes",
    schedule: "Lun-Vie 8:00 a.m. - 4:00 p.m.",
    location: "Entrada principal del campus",
    warning:
      "Los documentos presentados después del horario de atención se registrarán al día siguiente hábil. Algunos trámites requieren pago previo en Tesorería.",
  },
  {
    id: "becas",
    title: "Becas y Apoyo Económico",
    category: "becas",
    description:
      "Infórmate sobre las becas, apoyos económicos y programas de bienestar disponibles para estudiantes de La Cantuta.",
    icon: "🎓",
    steps: [
      "Revisa las convocatorias de becas publicadas oficialmente.",
      "Verifica los requisitos de cada programa.",
      "Prepara la documentación solicitada.",
      "Presenta tu postulación dentro del plazo establecido.",
      "Espera los resultados publicados por Bienestar Universitario.",
      "Si eres seleccionado, completa los trámites de aceptación.",
    ],
    documents: [
      "Ficha de postulación",
      "DNI y carné universitario",
      "Constancia de matrícula",
      "Historial académico",
      "Ficha socioeconómica (según el programa)",
      "Carta de motivación (si aplica)",
    ],
    area: "Bienestar Universitario",
    schedule: "Lun-Vie 8:30 a.m. - 4:30 p.m.",
    location: "Edificio de Bienestar Universitario",
    warning:
      "Las convocatorias de becas son temporales y tienen plazos estrictos. Revisa periódicamente los canales oficiales de la universidad para no perder oportunidades.",
  },
  {
    id: "orientacion",
    title: "Orientación para Cachimbos",
    category: "orientacion",
    description:
      "Guía básica para nuevos estudiantes de La Cantuta. Todo lo que necesitas saber para empezar tu vida universitaria.",
    icon: "🧭",
    steps: [
      "Asiste a la inducción universitaria (semana del cachimbro).",
      "Obtén tu carné universitario.",
      "Revisa tu plan de estudios y horario de clases.",
      "Conoce las instalaciones del campus.",
      "Afíliate a los servicios de biblioteca y bienestar.",
      "Únete a comunidades y grupos de estudio.",
    ],
    documents: [
      "DNI",
      "Constancia de ingreso / matrícula",
      "Fotos tamaño carné",
      "Certificado de estudios secundarios (original y copia)",
    ],
    area: "Oficina de Admisión / Bienestar Universitario",
    schedule: "Temporada de inducción: inicio de cada ciclo",
    location: "Campus principal",
    warning:
      "La semana de inducción es obligatoria para todos los ingresantes. No la pierdas, allí recibirás información clave para tu adaptación universitaria.",
  },
];

export const CATEGORY_LABELS: Record<TramiteCategory, string> = {
  matricula: "Matrícula",
  carnet: "Carné Universitario",
  constancias: "Constancias",
  comedor: "Comedor Universitario",
  biblioteca: "Biblioteca",
  "mesa-partes": "Mesa de Partes",
  becas: "Becas",
  orientacion: "Orientación para Cachimbos",
};

export const CATEGORY_ICONS: Record<TramiteCategory, string> = {
  matricula: "📋",
  carnet: "🪪",
  constancias: "📜",
  comedor: "🍽️",
  biblioteca: "📚",
  "mesa-partes": "📩",
  becas: "🎓",
  orientacion: "🧭",
};

export const TRAMITE_CATEGORY_ORDER: TramiteCategory[] = [
  "orientacion",
  "matricula",
  "carnet",
  "constancias",
  "comedor",
  "biblioteca",
  "mesa-partes",
  "becas",
];
