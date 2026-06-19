import { PrismaClient, ProductType, ProductPriceType, ProductCondition, ProductDeliveryType, Role, UniversityContentType, UniversityContentVisibility } from "@prisma/client";
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
