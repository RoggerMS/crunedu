import { PrismaClient, Role, UniversityContentType, UniversityContentVisibility } from "@prisma/client";
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

  const categories = [
    { name: "Materiales de estudio", slug: "materiales-estudio" },
    { name: "Útiles", slug: "utiles" },
    { name: "Merch universitario", slug: "merch-universitario" },
    { name: "Cursos y talleres", slug: "cursos-talleres" },
  ];

  for (const category of categories) {
    await prisma.productCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  const tags = ["matrícula", "carnet", "comedor", "apuntes", "matemática", "programación", "trámites"];
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-") },
      update: {},
      create: {
        name: tag,
        slug: tag.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-"),
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
