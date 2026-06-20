import { PrismaClient, ProductType, ProductPriceType, ProductCondition, ProductDeliveryType, Role, UniversityContentType, UniversityContentVisibility, UniversityItemType, UniversityItemModality, UniversityItemPriority, UniversityItemStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("CrunEdu123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@crunedu.local" },
    update: {},
    create: {
      email: "admin@crunedu.local",
      passwordHash,
      role: Role.ADMIN,
      isVerified: true,
      profile: {
        create: {
          firstName: "Admin",
          lastName: "CrunEdu",
          description: "Cuenta administradora local del MVP.",
        },
      },
    },
  });

  const une = await prisma.university.upsert({
    where: { slug: "la-cantuta" },
    update: {},
    create: {
      name: "Universidad Nacional de Educación Enrique Guzmán y Valle",
      shortName: "La Cantuta",
      slug: "la-cantuta",
    },
  });

  const ciencias = await prisma.faculty.upsert({
    where: { universityId_slug: { universityId: une.id, slug: "facultad-de-ciencias" } },
    update: {},
    create: {
      universityId: une.id,
      name: "Facultad de Ciencias",
      slug: "facultad-de-ciencias",
    },
  });

  await prisma.career.upsert({
    where: { facultyId_slug: { facultyId: ciencias.id, slug: "matematica-e-informatica" } },
    update: {},
    create: {
      facultyId: ciencias.id,
      name: "Matemática e Informática",
      slug: "matematica-e-informatica",
    },
  });

  const communities = [
    { name: "Cachimbos", slug: "cachimbos", description: "Orientación y apoyo para estudiantes que empiezan su vida universitaria." },
    { name: "Apuntes", slug: "apuntes", description: "Materiales permitidos, recomendaciones y recursos para estudiar." },
    { name: "Trámites", slug: "tramites", description: "Ayuda estudiantil sobre matrícula, constancias y procedimientos universitarios." },
    { name: "General", slug: "general", description: "Conversación y consultas generales de la comunidad CrunEdu." },
  ];

  for (const community of communities) {
    await prisma.community.upsert({
      where: { slug: community.slug },
      update: {},
      create: { ...community, createdBy: admin.id },
    });
  }

  // --- Store categories with icons ---
  const categories = [
    { name: "Libros y separatas", slug: "libros-separatas", description: "Textos, copias y material de cursos", icon: "BookOpen", order: 1 },
    { name: "Calculadoras", slug: "calculadoras", description: "Científicas y básicas para exámenes", icon: "Calculator", order: 2 },
    { name: "Materiales y útiles", slug: "materiales-utiles", description: "Cuadernos, lapiceros, mochilas y más", icon: "Backpack", order: 3 },
    { name: "Tecnología", slug: "tecnologia", description: "Laptops, accesorios y electrónicos", icon: "Laptop", order: 4 },
    { name: "Impresiones y copias", slug: "impresiones-copias", description: "Servicios de impresión, anillado y escaneo", icon: "Printer", order: 5 },
    { name: "Servicios académicos", slug: "servicios-academicos", description: "Tutorías, clases, diseño y edición", icon: "BriefcaseBusiness", order: 6 },
    { name: "Alimentación", slug: "alimentacion", description: "Comida y bebidas en el campus", icon: "Utensils", order: 7 },
    { name: "Emprendimientos", slug: "emprendimientos", description: "Negocios y propuestas estudiantiles", icon: "Rocket", order: 8 },
    { name: "Intercambios", slug: "intercambios", description: "Cambia sin pagar", icon: "Repeat2", order: 9 },
    { name: "Donaciones", slug: "donaciones", description: "Apoyo gratuito entre estudiantes", icon: "Gift", order: 10 },
  ];

  for (const category of categories) {
    await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description, icon: category.icon, order: category.order },
      create: category,
    });
  }

  // --- Safe points ---
  const safePoints = [
    { name: "Biblioteca Central", campus: "Campus UNE", description: "Zona amplia con mesas, iluminación y vigilancia.", reference: "Primer piso, junto a la entrada principal", schedule: "Lun-Vie 8:00 a.m. - 8:00 p.m." },
    { name: "Patio Principal", campus: "Campus UNE", description: "Espacio abierto, concurrido y con bancas disponibles.", reference: "Frente al Pabellón A", schedule: "Lun-Sáb 7:00 a.m. - 6:00 p.m." },
    { name: "Cafetería Central", campus: "Campus UNE", description: "Punto de encuentro habitual con mesas y personal.", reference: "Junto al comedor universitario", schedule: "Lun-Vie 7:00 a.m. - 5:00 p.m." },
    { name: "Entrada Principal", campus: "Campus UNE", description: "Puerta principal con control de ingreso.", reference: "Av. Las Palmeras s/n", schedule: "Lun-Dom 6:00 a.m. - 10:00 p.m." },
  ];

  for (const sp of safePoints) {
    await prisma.productSafePoint.upsert({
      where: { id: safePoints.indexOf(sp) + 1 },
      update: sp,
      create: sp,
    });
  }

  // --- Products ---
  const products = [
    {
      title: "Calculadora Casio fx-991ES PLUS",
      description: "Ideal para Matemática I y Física. Incluye estuche original y pilas nuevas. Poco uso, como nueva. Perfecta para parciales y finales.",
      price: 120,
      type: ProductType.SALE,
      priceType: ProductPriceType.FIXED,
      condition: ProductCondition.GOOD,
      deliveryType: ProductDeliveryType.CAMPUS,
      campus: "Biblioteca Central",
      course: "Matemática I",
      isFeatured: true,
      categorySlug: "calculadoras",
    },
    {
      title: "Libro de Cálculo Stewart 7ma edición",
      description: "Libro original en buen estado. Algunas marcas de lápiz borrables. Incluye solucionario parcial. Ideal para Cálculo I y II.",
      price: 85,
      type: ProductType.SALE,
      priceType: ProductPriceType.FIXED,
      condition: ProductCondition.GOOD,
      deliveryType: ProductDeliveryType.CAMPUS,
      campus: "Patio Principal",
      course: "Cálculo I",
      isFeatured: true,
      categorySlug: "libros-separatas",
    },
    {
      title: "Pack de separatas de Estadística",
      description: "Incluye ejercicios resueltos de Estadística Descriptiva e Inferencial. Separata completa del ciclo 2026-1.",
      price: 25,
      type: ProductType.SALE,
      priceType: ProductPriceType.FIXED,
      condition: ProductCondition.GOOD,
      deliveryType: ProductDeliveryType.CAMPUS,
      campus: "Facultad de Ciencias",
      course: "Estadística",
      isFeatured: false,
      categorySlug: "libros-separatas",
    },
    {
      title: "Servicio de impresión y anillado",
      description: "Impresiones blanco/negro desde S/ 0.15 y color desde S/ 0.50. Anillado con tapa incluida. Entrega en 1 hora. Para trabajos y monografías.",
      price: null,
      type: ProductType.SERVICE,
      priceType: ProductPriceType.FROM,
      isNegotiable: false,
      condition: ProductCondition.NOT_APPLICABLE,
      deliveryType: ProductDeliveryType.CAMPUS,
      campus: "Frente al campus",
      isFeatured: true,
      categorySlug: "impresiones-copias",
    },
    {
      title: "Laptop Lenovo i5 8GB RAM 256 SSD",
      description: "Perfecta para clases, trabajos y programación. Batería dura 4 horas. Cargador original incluido. Windows 11 instalado.",
      price: 1100,
      type: ProductType.SALE,
      priceType: ProductPriceType.NEGOTIABLE,
      isNegotiable: true,
      condition: ProductCondition.USED,
      deliveryType: ProductDeliveryType.SAFE_POINT,
      safePointId: 1,
      brand: "Lenovo",
      model: "ThinkPad T480",
      isFeatured: true,
      categorySlug: "tecnologia",
    },
    {
      title: "Menú universitario por pedido",
      description: "Almuerzos desde S/ 9 con segundo, sopa/entrada y refresco. Opciones vegetarianas. Pedidos por WhatsApp antes de las 11 a.m.",
      price: 9,
      type: ProductType.SERVICE,
      priceType: ProductPriceType.FROM,
      isNegotiable: false,
      condition: ProductCondition.NOT_APPLICABLE,
      deliveryType: ProductDeliveryType.CAMPUS,
      campus: "Cafetería Central",
      isFeatured: false,
      categorySlug: "alimentacion",
    },
    {
      title: "Clases de reforzamiento Matemática I",
      description: "Clases particulares presenciales o virtuales. Preparación para parciales con ejercicios tipo examen. Primera clase de prueba gratis.",
      price: 20,
      type: ProductType.SERVICE,
      priceType: ProductPriceType.HOURLY,
      isNegotiable: false,
      condition: ProductCondition.NOT_APPLICABLE,
      deliveryType: ProductDeliveryType.CAMPUS,
      campus: "Biblioteca Central",
      course: "Matemática I",
      isFeatured: false,
      categorySlug: "servicios-academicos",
    },
    {
      title: "Intercambio libro de Física por Cálculo",
      description: "Tengo Física Universitaria Vol. 1 de Sears Zemansky. Busco Cálculo de Stewart o similar. Buen estado ambos. Intercambio temporal también aceptado.",
      price: null,
      type: ProductType.EXCHANGE,
      priceType: ProductPriceType.EXCHANGE,
      isNegotiable: false,
      condition: ProductCondition.GOOD,
      deliveryType: ProductDeliveryType.CAMPUS,
      campus: "Patio Principal",
      course: "Física I",
      isFeatured: false,
      categorySlug: "intercambios",
    },
    {
      title: "Donación de separatas usadas",
      description: "Separatas de varios cursos en buen estado. Gratis para cachimbos que estén empezando. Solo recoger en campus.",
      price: null,
      type: ProductType.DONATION,
      priceType: ProductPriceType.FREE,
      isNegotiable: false,
      condition: ProductCondition.USED,
      deliveryType: ProductDeliveryType.CAMPUS,
      campus: "Biblioteca Central",
      isFeatured: false,
      categorySlug: "donaciones",
    },
    {
      title: "Diseño de diapositivas para exposición",
      description: "Presentaciones limpias y profesionales para tus exposiciones. Incluye imágenes y diagramas. Entrega en 24 horas. Revisión incluida.",
      price: 30,
      type: ProductType.SERVICE,
      priceType: ProductPriceType.FIXED,
      isNegotiable: false,
      condition: ProductCondition.NOT_APPLICABLE,
      deliveryType: ProductDeliveryType.DIGITAL,
      isFeatured: false,
      categorySlug: "servicios-academicos",
    },
    {
      title: "Cuadernos nuevos pack x5",
      description: "Pack de 5 cuadernos universitarios tamaño A4, 100 hojas rayadas. Varios colores disponibles. Sellados de fábrica.",
      price: 18,
      type: ProductType.SALE,
      priceType: ProductPriceType.FIXED,
      condition: ProductCondition.NEW,
      deliveryType: ProductDeliveryType.CAMPUS,
      campus: "Cafetería Central",
      isFeatured: false,
      categorySlug: "materiales-utiles",
    },
    {
      title: "Servicio de escaneo de documentos",
      description: "Escaneo de documentos a PDF de alta calidad. Hasta 100 páginas por entrega. Corrección básica de orientación. USB o correo.",
      price: 8,
      type: ProductType.SERVICE,
      priceType: ProductPriceType.FIXED,
      condition: ProductCondition.NOT_APPLICABLE,
      deliveryType: ProductDeliveryType.DIGITAL,
      isFeatured: false,
      categorySlug: "impresiones-copias",
    },
  ];

  for (const p of products) {
    const category = await prisma.productCategory.findUnique({ where: { slug: p.categorySlug } });
    if (!category) continue;

    const safePointField = p.safePointId ? { safePointId: p.safePointId } : {};

    await prisma.product.create({
      data: {
        title: p.title,
        description: p.description,
        price: p.price,
        currency: "PEN",
        categoryId: category.id,
        status: "ACTIVE",
        type: p.type,
        priceType: p.priceType,
        isNegotiable: p.isNegotiable ?? false,
        condition: p.condition ?? null,
        deliveryType: p.deliveryType,
        campus: p.campus ?? null,
        course: p.course ?? null,
        brand: p.brand ?? null,
        model: p.model ?? null,
        quantity: 1,
        stock: 1,
        isFeatured: p.isFeatured ?? false,
        contactMethod: "chat",
        createdBy: admin.id,
        publishedAt: new Date(),
        ...safePointField,
      },
    });
  }

  const tags = ["matrícula", "carnet", "comedor", "apuntes", "matemática", "programación", "trámites"];
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-") },
      update: {},
      create: {
        name: tag,
        slug: tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-"),
      },
    });
  }

  const universityContent = [
    {
      type: UniversityContentType.TRAMITE,
      title: "Matrícula extemporánea 2026-2",
      description: "Proceso habilitado para estudiantes con observaciones académicas. Realiza el pago por concepto de matrícula extemporánea y presenta tus documentos en Secretaría Académica.",
      area: "Secretaría Académica",
      category: "Matrícula",
      visibility: UniversityContentVisibility.OFICIAL,
      statusTags: ["urgente", "oficial", "proximo_cierre"],
      deadline: new Date("2026-05-15"),
      icon: "📋",
      steps: ["Solicita la autorización en Secretaría Académica.", "Realiza el pago en Tesorería.", "Presenta tu ficha de matrícula actualizada.", "Espera la confirmación por correo institucional."],
      documents: ["Solicitud dirigida a Secretaría Académica", "Recibo de pago por matrícula extemporánea", "DNI o carné universitario vigente"],
      schedule: "Lun-Vie 8:00 a.m. - 5:00 p.m.",
      location: "Pabellón A, primer piso",
      warning: "Las fechas exactas y requisitos pueden variar cada ciclo. Verifica siempre la información oficial publicada por la universidad.",
      views: 1420,
      savesCount: 230,
      status: "PUBLISHED",
      userId: admin.id,
    },
    {
      type: UniversityContentType.EVENTO,
      title: "Cine universitario: función especial este viernes",
      description: "Proyección y conversatorio sobre cine peruano contemporáneo. Participa de esta actividad cultural abierta a toda la comunidad universitaria.",
      area: "Cultura",
      category: "Cultura",
      visibility: UniversityContentVisibility.PUBLICO,
      statusTags: ["nuevo"],
      startDate: new Date("2026-05-14"),
      time: "19:00",
      location: "Aula Magna",
      views: 640,
      savesCount: 122,
      status: "PUBLISHED",
      userId: admin.id,
    },
    {
      type: UniversityContentType.GUIA,
      title: "Cómo solicitar una constancia de estudios",
      description: "Guía paso a paso con requisitos y tiempos de respuesta para obtener tu constancia de estudios en La Cantuta.",
      area: "Secretaría Académica",
      category: "Trámites",
      visibility: UniversityContentVisibility.OFICIAL,
      statusTags: ["oficial", "actualizado"],
      icon: "📘",
      steps: ["Redacta una solicitud dirigida a Secretaría Académica.", "Adjunta el comprobante de pago por derecho de constancia.", "Presenta ambos documentos en Mesa de Partes.", "Espera de 3 a 5 días hábiles para la entrega."],
      documents: ["Solicitud simple dirigida a Secretaría Académica", "Comprobante de pago (Tesorería)", "DNI o carné universitario"],
      schedule: "Lun-Vie 8:00 a.m. - 4:00 p.m.",
      location: "Mesa de Partes, Pabellón A",
      warning: "Los tiempos de entrega pueden extenderse en períodos de matrícula o evaluaciones finales.",
      fileUrl: "/files/requisitos-constancia.pdf",
      fileName: "requisitos-constancia.pdf",
      fileType: "pdf",
      fileSize: 324000,
      views: 2030,
      savesCount: 410,
      status: "PUBLISHED",
      userId: admin.id,
    },
  ];

  for (const content of universityContent) {
    await prisma.universityContent.create({ data: content });
  }

  // --- University Categories ---
  const uniCategories = [
    { name: "Trámites", slug: "tramites", description: "Procedimientos y gestiones administrativas", icon: "FileText", color: "#7C3AED", order: 1 },
    { name: "Convocatorias", slug: "convocatorias", description: "Llamados a becas, concursos y programas", icon: "Megaphone", color: "#059669", order: 2 },
    { name: "Eventos", slug: "eventos", description: "Actividades culturales, académicas y sociales", icon: "Calendar", color: "#D97706", order: 3 },
    { name: "Servicios", slug: "servicios", description: "Servicios universitarios disponibles", icon: "Building2", color: "#2563EB", order: 4 },
    { name: "Académico", slug: "academico", description: "Calendario académico, horarios y fechas", icon: "GraduationCap", color: "#0891B2", order: 5 },
    { name: "Becas", slug: "becas", description: "Oportunidades de becas y apoyos económicos", icon: "Award", color: "#DC2626", order: 6 },
    { name: "Cultura", slug: "cultura", description: "Teatro, cine, música y arte universitario", icon: "Palette", color: "#DB2777", order: 7 },
    { name: "Deportes", slug: "deportes", description: "Actividades deportivas y campeonatos", icon: "Trophy", color: "#EA580C", order: 8 },
    { name: "Bienestar", slug: "bienestar", description: "Salud, orientación y apoyo estudiantil", icon: "Heart", color: "#E11D48", order: 9 },
    { name: "Pagos", slug: "pagos", description: "Información sobre pagos y tesorería", icon: "Wallet", color: "#65A30D", order: 10 },
    { name: "Biblioteca", slug: "biblioteca", description: "Servicios y recursos bibliotecarios", icon: "Library", color: "#4F46E5", order: 11 },
    { name: "Empleabilidad", slug: "empleabilidad", description: "Bolsa de trabajo y desarrollo profesional", icon: "Briefcase", color: "#0D9488", order: 12 },
  ];

  const createdCategories: Record<string, number> = {};
  for (const cat of uniCategories) {
    const created = await prisma.universityCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, icon: cat.icon, color: cat.color, order: cat.order },
      create: cat,
    });
    createdCategories[cat.slug] = created.id;
  }

  // --- University Areas ---
  const uniAreas = [
    { name: "Secretaría Académica", slug: "secretaria-academica", description: "Trámites académicos y constancias", icon: "FileText", contactEmail: "secretaria@crunedu.local", contactPhone: "+51 123 456 789" },
    { name: "Tesorería", slug: "tesoreria", description: "Pagos y estados de cuenta", icon: "Wallet", contactEmail: "tesoreria@crunedu.local", contactPhone: "+51 123 456 790" },
    { name: "Bienestar Universitario", slug: "bienestar-universitario", description: "Becas y apoyo estudiantil", icon: "Heart", contactEmail: "bienestar@crunedu.local", contactPhone: "+51 123 456 791" },
    { name: "Biblioteca Central", slug: "biblioteca-central", description: "Préstamos y recursos bibliográficos", icon: "Library", contactEmail: "biblioteca@crunedu.local", contactPhone: "+51 123 456 792" },
    { name: "Oficina de Admisión", slug: "admision", description: "Proceso de admisión e ingreso", icon: "DoorOpen", contactEmail: "admision@crunedu.local" },
    { name: "Dirección de Investigación", slug: "investigacion", description: "Investigación y publicaciones", icon: "FlaskConical", contactEmail: "investigacion@crunedu.local" },
    { name: "Oficina de Grados y Títulos", slug: "grados-titulos", description: "Titulación y grados académicos", icon: "ScrollText", contactEmail: "grados@crunedu.local" },
    { name: "Centro de Idiomas", slug: "centro-idiomas", description: "Cursos de idiomas y certificaciones", icon: "Languages", contactEmail: "idiomas@crunedu.local" },
    { name: "Empleabilidad", slug: "empleabilidad", description: "Bolsa de trabajo y prácticas", icon: "Briefcase", contactEmail: "empleabilidad@crunedu.local" },
    { name: "Cultura y Deportes", slug: "cultura-deportes", description: "Actividades culturales y deportivas", icon: "Palette", contactEmail: "cultura@crunedu.local" },
    { name: "Mesa de Partes", slug: "mesa-partes", description: "Recepción de documentos", icon: "Inbox", contactEmail: "mesadepartes@crunedu.local" },
    { name: "Soporte Técnico", slug: "soporte-tecnico", description: "Soporte de sistemas y TIC", icon: "Monitor", contactEmail: "soporte@crunedu.local" },
  ];

  const createdAreas: Record<string, number> = {};
  for (const area of uniAreas) {
    const created = await prisma.universityArea.upsert({
      where: { universityId_slug: { universityId: une.id, slug: area.slug } },
      update: { name: area.name, description: area.description, icon: area.icon, contactEmail: area.contactEmail, contactPhone: area.contactPhone },
      create: { universityId: une.id, ...area },
    });
    createdAreas[area.slug] = created.id;
  }

  // --- University Calendar Items ---
  const now = new Date();
  const day = (offset: number) => { const d = new Date(now); d.setDate(d.getDate() + offset); return d; };

  const calendarItems = [
    {
      type: UniversityItemType.PROCEDURE,
      title: "Matrícula extemporánea 2026-2",
      summary: "Proceso habilitado para estudiantes con observaciones académicas",
      description: "Realiza el pago por concepto de matrícula extemporánea y presenta tus documentos en Secretaría Académica. Este trámite está disponible por tiempo limitado.",
      categorySlug: "tramites",
      areaSlug: "secretaria-academica",
      modality: UniversityItemModality.IN_PERSON,
      priority: UniversityItemPriority.URGENT,
      locationName: "Pabellón A, primer piso",
      startsAt: day(0),
      endsAt: day(15),
      allDay: true,
      isFeatured: true,
    },
    {
      type: UniversityItemType.CALL,
      title: "Beca Alimentaria 2026",
      summary: "Postula al programa de beca alimentaria para estudiantes",
      description: "La beca alimentaria cubre el 100% del costo del comedor universitario durante el ciclo 2026-2. Dirigido a estudiantes con alto rendimiento académico y bajos recursos.",
      categorySlug: "becas",
      areaSlug: "bienestar-universitario",
      modality: UniversityItemModality.ONLINE,
      priority: UniversityItemPriority.IMPORTANT,
      locationName: "Plataforma virtual",
      startsAt: day(0),
      endsAt: day(30),
      allDay: true,
      isFeatured: true,
    },
    {
      type: UniversityItemType.EVENT,
      title: "Cine universitario: función especial",
      summary: "Proyección y conversatorio sobre cine peruano contemporáneo",
      description: "Participa de esta actividad cultural abierta a toda la comunidad universitaria. Contaremos con la presencia de directores invitados.",
      categorySlug: "cultura",
      areaSlug: "cultura-deportes",
      modality: UniversityItemModality.IN_PERSON,
      priority: UniversityItemPriority.NORMAL,
      locationName: "Aula Magna",
      startsAt: day(2),
      endsAt: day(2),
      allDay: false,
    },
    {
      type: UniversityItemType.SERVICE,
      title: "Atención de Tesorería - Horario extendido",
      summary: "Atención especial para pagos de matrícula y cuotas",
      description: "Tesorería atenderá en horario extendido de 7:00 a.m. a 6:00 p.m. durante la temporada de matrícula para facilitar los pagos.",
      categorySlug: "pagos",
      areaSlug: "tesoreria",
      modality: UniversityItemModality.IN_PERSON,
      priority: UniversityItemPriority.IMPORTANT,
      locationName: "Pabellón B, Tesorería",
      startsAt: day(0),
      endsAt: day(20),
      allDay: true,
    },
    {
      type: UniversityItemType.ACADEMIC,
      title: "Inicio de clases 2026-2",
      summary: "Inicio del segundo semestre académico",
      description: "Las clases del ciclo 2026-2 inician según el calendario académico oficial. Verifica tu horario en el sistema académico.",
      categorySlug: "academico",
      areaSlug: "secretaria-academica",
      modality: UniversityItemModality.IN_PERSON,
      priority: UniversityItemPriority.NORMAL,
      startsAt: day(45),
      endsAt: day(45),
      allDay: true,
    },
    {
      type: UniversityItemType.PAYMENT,
      title: "Vencimiento cuota 2 - Ciclo 2026-2",
      summary: "Fecha límite para pago de segunda cuota",
      description: "Realiza el pago de tu segunda cuota antes de la fecha de vencimiento para evitar recargos. Puedes pagar en Tesorería o mediante depósito bancario.",
      categorySlug: "pagos",
      areaSlug: "tesoreria",
      modality: UniversityItemModality.IN_PERSON,
      priority: UniversityItemPriority.URGENT,
      locationName: "Tesorería - Pabellón B",
      startsAt: day(30),
      endsAt: day(30),
      allDay: true,
    },
    {
      type: UniversityItemType.CULTURE,
      title: "Festival de teatro universitario",
      summary: "Muestra de obras teatrales de los talleres culturales",
      description: "Disfruta de las mejores obras preparadas por los talleres de teatro de las diferentes facultades. Entrada libre.",
      categorySlug: "cultura",
      areaSlug: "cultura-deportes",
      modality: UniversityItemModality.IN_PERSON,
      priority: UniversityItemPriority.NORMAL,
      locationName: "Teatro Universitario",
      startsAt: day(10),
      endsAt: day(12),
      allDay: false,
    },
    {
      type: UniversityItemType.SPORTS,
      title: "Campeonato de fútbol inter-facultades",
      summary: "Inscripciones abiertas para el campeonato deportivo",
      description: "Forma tu equipo y participa en el campeonato de fútbol de la universidad. Categoría varones y mujeres.",
      categorySlug: "deportes",
      areaSlug: "cultura-deportes",
      modality: UniversityItemModality.IN_PERSON,
      priority: UniversityItemPriority.NORMAL,
      locationName: "Campo Deportivo UNE",
      startsAt: day(7),
      endsAt: day(60),
      allDay: true,
    },
    {
      type: UniversityItemType.WELLBEING,
      title: "Campaña de salud gratuita",
      summary: "Atención médica gratuita para toda la comunidad",
      description: "Campaña de salud integral con atenciones en medicina general, odontología, psicología y nutrición. No requiere cita previa.",
      categorySlug: "bienestar",
      areaSlug: "bienestar-universitario",
      modality: UniversityItemModality.IN_PERSON,
      priority: UniversityItemPriority.IMPORTANT,
      locationName: "Centro de Salud Universitario",
      startsAt: day(5),
      endsAt: day(5),
      allDay: true,
    },
    {
      type: UniversityItemType.CALL,
      title: "Convocatoria de investigación 2026",
      summary: "Fondo de investigación para docentes y estudiantes",
      description: "Convocatoria para proyectos de investigación. Financiamiento de hasta S/ 10,000 por proyecto. Pueden participar docentes y estudiantes de los últimos ciclos.",
      categorySlug: "convocatorias",
      areaSlug: "investigacion",
      modality: UniversityItemModality.ONLINE,
      priority: UniversityItemPriority.IMPORTANT,
      locationName: "Portal de investigación",
      startsAt: day(0),
      endsAt: day(60),
      allDay: true,
    },
    {
      type: UniversityItemType.SCHOLARSHIP,
      title: "Beca de movilidad internacional",
      summary: "Intercambio estudiantil en universidades extranjeras",
      description: "Postula al programa de movilidad académica internacional. Destinos: España, México, Colombia y Brasil. Cubre pasajes, alojamiento y manutención.",
      categorySlug: "becas",
      areaSlug: "bienestar-universitario",
      modality: UniversityItemModality.ONLINE,
      priority: UniversityItemPriority.URGENT,
      locationName: "Plataforma de postulación",
      startsAt: day(0),
      endsAt: day(25),
      allDay: true,
    },
    {
      type: UniversityItemType.GUIDE,
      title: "Guía para solicitar constancia de estudios",
      summary: "Pasos para obtener tu constancia de estudios",
      description: "Guía detallada con requisitos y tiempos de respuesta para obtener tu constancia de estudios en La Cantuta.",
      categorySlug: "tramites",
      areaSlug: "secretaria-academica",
      modality: UniversityItemModality.NOT_APPLICABLE,
      priority: UniversityItemPriority.NORMAL,
      allDay: true,
    },
    {
      type: UniversityItemType.NOTICE,
      title: "Suspensión de actividades por mantenimiento",
      summary: "Suspensión temporal de servicios administrativos",
      description: "El día viernes 20 de junio se suspenderán las atenciones administrativas por trabajos de mantenimiento eléctrico en el campus.",
      categorySlug: "servicios",
      areaSlug: "soporte-tecnico",
      modality: UniversityItemModality.NOT_APPLICABLE,
      priority: UniversityItemPriority.IMPORTANT,
      allDay: true,
      startsAt: day(3),
      endsAt: day(3),
    },
  ];

  for (const item of calendarItems) {
    const categoryId = createdCategories[item.categorySlug];
    const areaId = item.areaSlug ? createdAreas[item.areaSlug] : null;
    if (!categoryId) continue;

    const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + String(Date.now());

    const created = await prisma.universityCalendarItem.create({
      data: {
        universityId: une.id,
        categoryId,
        areaId,
        createdById: admin.id,
        type: item.type,
        title: item.title,
        slug: slug + "-" + Math.random().toString(36).slice(2, 6),
        summary: item.summary,
        description: item.description,
        modality: item.modality,
        priority: item.priority,
        locationName: item.locationName ?? null,
        startsAt: item.startsAt ?? null,
        endsAt: item.endsAt ?? null,
        allDay: item.allDay,
        isFeatured: item.isFeatured ?? false,
        status: UniversityItemStatus.PUBLISHED,
      },
    });

    if (item.startsAt && item.endsAt) {
      await prisma.universityCalendarOccurrence.create({
        data: {
          itemId: created.id,
          startsAt: item.startsAt,
          endsAt: item.endsAt,
          allDay: item.allDay,
          locationName: item.locationName ?? null,
          status: UniversityItemStatus.ACTIVE,
        },
      });
    }
  }

  // --- Extended University Content ---
  const extendedContent = [
    {
      type: UniversityContentType.TRAMITE,
      title: "Reserva de matrícula 2026-2",
      description: "Procedimiento para reservar tu matrícula si no puedes cursar el ciclo completo por motivos justificados. Presenta tu solicitud en Secretaría Académica.",
      area: "Secretaría Académica",
      category: "Matrícula",
      visibility: UniversityContentVisibility.OFICIAL,
      statusTags: ["oficial", "actualizado"],
      deadline: new Date("2026-07-30"),
      icon: "📋",
      steps: ["Descarga el formato de solicitud de reserva.", "Adjunta el informe médico o sustento correspondiente.", "Presenta en Secretaría Académica.", "Espera la resolución en un plazo de 5 días hábiles."],
      documents: ["Formato de solicitud de reserva", "Sustento (médico, laboral, etc.)", "Carné universitario vigente"],
      schedule: "Lun-Vie 8:00 a.m. - 5:00 p.m.",
      location: "Secretaría Académica, Pabellón A",
      cost: "S/ 25.00",
      warning: "La reserva solo aplica por un ciclo. No cubre el siguiente período académico.",
      views: 890,
      savesCount: 145,
      userId: admin.id,
      categorySlug: "tramites",
      areaSlug: "secretaria-academica",
      modality: "presencial",
    },
    {
      type: UniversityContentType.EVENTO,
      title: "Taller de empleabilidad: Cómo preparar tu CV",
      description: "Taller práctico para estudiantes de los últimos ciclos. Aprende a redactar tu CV, carta de presentación y a prepararte para entrevistas laborales.",
      area: "Empleabilidad",
      category: "Taller",
      visibility: UniversityContentVisibility.PUBLICO,
      statusTags: ["nuevo", "abierto"],
      startDate: new Date("2026-06-25"),
      time: "15:00",
      location: "Auditorio de la Facultad de Ciencias",
      cost: "Gratuito",
      views: 340,
      savesCount: 78,
      userId: admin.id,
      categorySlug: "empleabilidad",
      areaSlug: "empleabilidad",
      modality: "presencial",
    },
    {
      type: UniversityContentType.SERVICIO,
      title: "Horario de atención de Biblioteca Central",
      description: "La Biblioteca Central ofrece servicios de préstamo, lectura en sala, acceso a bases de datos digitales y apoyo en investigación.",
      area: "Biblioteca",
      category: "Servicios",
      visibility: UniversityContentVisibility.OFICIAL,
      statusTags: ["oficial"],
      schedule: "Lun-Sáb 7:00 a.m. - 9:00 p.m.",
      location: "Biblioteca Central, primer piso",
      icon: "📚",
      views: 2450,
      savesCount: 520,
      userId: admin.id,
      categorySlug: "biblioteca",
      areaSlug: "biblioteca-central",
      modality: "presencial",
    },
    {
      type: UniversityContentType.CONVOCATORIA,
      title: "Concurso de becas por excelencia académica",
      description: "La universidad otorgará 20 becas integrales para el ciclo 2026-2 a los estudiantes con los promedios más altos de cada facultad.",
      area: "Bienestar Universitario",
      category: "Becas",
      visibility: UniversityContentVisibility.OFICIAL,
      statusTags: ["oficial", "nuevo"],
      deadline: new Date("2026-07-15"),
      cost: "Gratuito",
      externalUrl: "https://becas.crunedu.local/concurso",
      views: 1800,
      savesCount: 390,
      userId: admin.id,
      categorySlug: "becas",
      areaSlug: "bienestar-universitario",
      modality: "online",
    },
    {
      type: UniversityContentType.GUIA,
      title: "¿Cómo solicitar tu carné universitario?",
      description: "Guía completa para tramitar tu carné universitario por primera vez o renovarlo.",
      area: "Secretaría Académica",
      category: "Trámites",
      visibility: UniversityContentVisibility.OFICIAL,
      statusTags: ["oficial"],
      icon: "🪪",
      steps: ["Ingresa al sistema de trámites en línea.", "Completa el formulario de solicitud.", "Adjunta tu foto tamaño carné.", "Realiza el pago de S/ 15.00.", "Recoge tu carné en 7 días hábiles."],
      documents: ["DNI vigente", "Foto tamaño carné", "Comprobante de pago", "Constancia de matrícula"],
      schedule: "Lun-Vie 8:00 a.m. - 4:00 p.m.",
      location: "Secretaría Académica, Pabellón A",
      cost: "S/ 15.00",
      warning: "El carné es personal e intransferible. El reemplazo por pérdida tiene un costo de S/ 25.00.",
      views: 3100,
      savesCount: 670,
      userId: admin.id,
      categorySlug: "tramites",
      areaSlug: "secretaria-academica",
      modality: "presencial",
    },
    {
      type: UniversityContentType.EVENTO,
      title: "Conferencia: Inteligencia Artificial en la Educación",
      description: "Conferencia magistral a cargo del Dr. Carlos Mendoza sobre las aplicaciones de la IA en el ámbito educativo y su impacto en la formación profesional.",
      area: "Investigación",
      category: "Académico",
      visibility: UniversityContentVisibility.PUBLICO,
      statusTags: ["nuevo"],
      startDate: new Date("2026-07-05"),
      time: "10:00",
      location: "Auditorio Principal",
      cost: "Gratuito",
      capacity: 150,
      views: 420,
      savesCount: 95,
      userId: admin.id,
      categorySlug: "academico",
      areaSlug: "investigacion",
      modality: "hibrido",
    },
    {
      type: UniversityContentType.TRAMITE,
      title: "Solicitud de convalidación de cursos",
      description: "Trámite para convalidar cursos llevados en otra universidad o instituto. Dirigido a estudiantes de intercambio o traslado externo.",
      area: "Secretaría Académica",
      category: "Trámites",
      visibility: UniversityContentVisibility.OFICIAL,
      statusTags: ["oficial"],
      steps: ["Solicita tu constancia de notas original.", "Presenta los sílabos de los cursos a convalidar.", "Completa el formulario de convalidación.", "Espera la resolución del comité académico."],
      documents: ["Constancia de notas original", "Sílabos de cursos", "Formulario de convalidación", "Carta de motivación"],
      schedule: "Lun-Vie 8:00 a.m. - 5:00 p.m.",
      location: "Secretaría Académica, Pabellón A",
      cost: "S/ 10.00 por curso",
      warning: "La convalidación está sujeta a evaluación del comité académico de cada facultad.",
      views: 560,
      savesCount: 110,
      userId: admin.id,
      categorySlug: "tramites",
      areaSlug: "secretaria-academica",
      modality: "presencial",
    },
    {
      type: UniversityContentType.AVISO,
      title: "Comunicado: Nuevo sistema de matrícula en línea",
      description: "Se informa a toda la comunidad estudiantil que a partir del ciclo 2026-2, el proceso de matrícula se realizará exclusivamente a través del nuevo sistema en línea.",
      area: "Secretaría Académica",
      category: "Comunicados",
      visibility: UniversityContentVisibility.OFICIAL,
      statusTags: ["oficial", "nuevo"],
      externalUrl: "https://matricula.crunedu.local",
      views: 2100,
      savesCount: 320,
      userId: admin.id,
      categorySlug: "servicios",
      areaSlug: "secretaria-academica",
      modality: "online",
    },
    {
      type: UniversityContentType.TRAMITE,
      title: "Trámite de certificado de estudios",
      description: "Obtén tu certificado de estudios oficial para trámites externos como traslados, intercambios o postulaciones.",
      area: "Secretaría Académica",
      category: "Trámites",
      visibility: UniversityContentVisibility.OFICIAL,
      statusTags: ["oficial"],
      steps: ["Solicita el certificado en Secretaría Académica.", "Realiza el pago del derecho de certificado.", "Espera 5 días hábiles para la emisión."],
      documents: ["Solicitud dirigida a Secretaría Académica", "Comprobante de pago", "DNI"],
      schedule: "Lun-Vie 8:00 a.m. - 4:00 p.m.",
      location: "Mesa de Partes, Pabellón A",
      cost: "S/ 30.00",
      views: 1780,
      savesCount: 390,
      userId: admin.id,
      categorySlug: "tramites",
      areaSlug: "secretaria-academica",
      modality: "presencial",
    },
  ];

  for (const content of extendedContent) {
    const { categorySlug, areaSlug, ...rest } = content as any;
    const categoryId = categorySlug ? createdCategories[categorySlug] : undefined;
    const areaId = areaSlug ? createdAreas[areaSlug] : undefined;
    await prisma.universityContent.create({
      data: {
        ...rest,
        categoryId: categoryId ?? null,
        areaId: areaId ?? null,
      },
    });
  }

  console.log("Seed completed.");
  console.log("Admin email: admin@crunedu.local");
  console.log("Admin password: CrunEdu123!");
  console.log("Store: 10 categories, 4 safe points, 12 products created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
