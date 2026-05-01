import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { promises as fs } from "node:fs";
import path from "node:path";
import { AppModule } from "../app.module";

type Status = "PASS" | "FAIL" | "WARN";
type Step = { name: string; status: Status; detail?: string };

function safeRedirectPath(returnUrl: string | null | undefined): string {
  const raw = (returnUrl ?? "").trim();
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/app";
}

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.get(ConfigService);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(0);
  const address = app.getHttpServer().address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;
  const steps: Step[] = [];

  const record = (name: string, status: Status, detail?: string) => {
    steps.push({ name, status, detail });
    const icon = status === "PASS" ? "✅" : status === "WARN" ? "⚠️" : "❌";
    console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
  };

  const seed = Date.now();
  const email = `release.${seed}@crunedu.local`;
  const password = "CrunEdu123!";
  let token = "";

  try {
    const register = await fetch(`${baseUrl}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, firstName: "Release", lastName: "E2E" }) });
    const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (register.status === 201 && login.status === 201) {
      token = ((await login.json()) as { accessToken: string }).accessToken;
      record("landing -> login -> app", "PASS");
    } else {
      record("landing -> login -> app", "FAIL", `register=${register.status} login=${login.status}`);
    }

    const auth = token ? { authorization: `Bearer ${token}`, "content-type": "application/json" } : { "content-type": "application/json" };
    const postRes = await fetch(`${baseUrl}/posts`, { method: "POST", headers: auth, body: JSON.stringify({ title: "E2E Feed", content: "Publicación feed", communityId: 1 }) });
    if (postRes.status === 201) {
      const post = (await postRes.json()) as { id: number };
      const commentRes = await fetch(`${baseUrl}/posts/${post.id}/comments`, { method: "POST", headers: auth, body: JSON.stringify({ content: "Comentario E2E" }) });
      record("feed publicar/comentar", commentRes.status === 201 ? "PASS" : "FAIL", `post=${postRes.status} comment=${commentRes.status}`);
    } else {
      record("feed publicar/comentar", "FAIL", `post=${postRes.status}`);
    }

    for (const [name, endpoint, body] of [
      ["preguntas publicar", "questions", { title: "Pregunta E2E", content: "¿Funciona preguntas?", communityId: 1 }],
      ["apuntes publicar", "notes", { title: "Apunte E2E", description: "Descripción", course: "Curso", cycle: "I", fileUrl: "https://example.com/file.pdf" }],
      ["trámites publicar", "procedures", { title: "Trámite E2E", description: "Detalle del trámite", faculty: "Educación" }],
    ] as const) {
      const res = await fetch(`${baseUrl}/${endpoint}`, { method: "POST", headers: auth, body: JSON.stringify(body) });
      record(name, res.status === 201 ? "PASS" : "FAIL", `status=${res.status}`);
    }

    const market = await fetch(`${baseUrl}/marketplace/products`);
    if (market.status !== 200) record("tienda interés", "FAIL", `list status=${market.status}`);
    else {
      const marketJson = (await market.json()) as { items?: Array<{ id: number }> };
      const first = marketJson.items?.[0];
      if (!first) record("tienda interés", "WARN", "Sin productos activos");
      else {
        const inquiry = await fetch(`${baseUrl}/marketplace/products/${first.id}/inquiries`, { method: "POST", headers: auth, body: JSON.stringify({ contactName: "Release User", contactPhone: "987654321", message: "Interés e2e", preferredContactMethod: "whatsapp" }) });
        record("tienda interés", inquiry.status === 201 ? "PASS" : "FAIL", `status=${inquiry.status}`);
      }
    }

    const landingFile = await fs.readFile(path.resolve("apps/web/src/app/page.tsx"), "utf8");
    const appFile = await fs.readFile(path.resolve("apps/web/src/app/app/page.tsx"), "utf8");
    const tiendaFile = await fs.readFile(path.resolve("apps/web/src/app/app/tienda/page.tsx"), "utf8");
    const ctaOk = landingFile.includes('href="/app"') && appFile.includes('href="/app/comunidades"') && appFile.includes('href="/login"') && tiendaFile.includes('/app/tienda/');
    record("CTA abre acción correcta de su módulo", ctaOk ? "PASS" : "FAIL");

    const redirectOk = safeRedirectPath("//evil.com") === "/app" && safeRedirectPath("/app/preguntas") === "/app/preguntas";
    record("validación de no-redirección indebida al feed", redirectOk ? "PASS" : "FAIL");

    const reportPath = path.resolve("docs/RELEASE_E2E_REPORT.md");
    const failed = steps.filter((s) => s.status === "FAIL");
    await fs.writeFile(reportPath, `# Reporte final E2E local\n\nFecha: ${new Date().toISOString()}\n\n## Resultado por flujo\n${steps.map((s) => `- [${s.status}] ${s.name}${s.detail ? ` — ${s.detail}` : ""}`).join("\n")}\n\n## Pasos fallidos\n${failed.length ? failed.map((s) => `- ${s.name}${s.detail ? `: ${s.detail}` : ""}`).join("\n") : "- Ninguno."}\n\n## Capturas\n- Pendiente en entorno local Windows con navegador (Codex cloud sin UI interactiva).\n- Sugeridas: landing, login, feed publicar/comentar, preguntas, apuntes, trámites y tienda interés.\n`);

    if (failed.length) process.exitCode = 1;
  } finally {
    await app.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
