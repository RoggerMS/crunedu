import { PrismaClient, Role } from "@prisma/client";
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
    { name: "General", slug: "general", description: "Conversación general de la comunidad." },
    { name: "Trámites", slug: "tramites", description: "Carnet, matrícula, comedor, constancias y procesos universitarios." },
    { name: "Apuntes", slug: "apuntes", description: "Materiales propios, resúmenes y documentos permitidos." },
    { name: "Cachimbos", slug: "cachimbos", description: "Guía para estudiantes nuevos." },
  ];

  for (const community of communities) {
    await prisma.community.upsert({
      where: { slug: community.slug },
      update: {},
      create: {
        ...community,
        createdBy: admin.id,
      },
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
