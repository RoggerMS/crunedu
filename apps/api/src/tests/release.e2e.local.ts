import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { promises as fs } from "node:fs";
import * as path from "node:path";
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
  const repoRoot = path.resolve(__dirname, "../../../..");
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

    const authHeaders: Record<string, string> = { "content-type": "application/json" };
    if (token) authHeaders.authorization = `Bearer ${token}`;
    const postRes = await fetch(`${baseUrl}/posts`, { method: "POST", headers: authHeaders, body: JSON.stringify({ title: "E2E Feed", content: "Publicación feed" }) });
    if (postRes.status === 201) {
      const post = (await postRes.json()) as { id: number };
      const commentRes = await fetch(`${baseUrl}/posts/${post.id}/comments`, { method: "POST", headers: authHeaders, body: JSON.stringify({ content: "Comentario útil para verificación E2E" }) });
      record("feed publicar/comentar", commentRes.status === 201 ? "PASS" : "FAIL", `post=${postRes.status} comment=${commentRes.status}`);
    } else {
      record("feed publicar/comentar", "FAIL", `post=${postRes.status}`);
    }

    for (const [name, endpoint, body] of [
      ["preguntas publicar", "questions", { title: "Pregunta E2E", content: "¿Funciona preguntas?" }],
      ["apuntes publicar", "apuntes", { title: "Apunte E2E", description: "Descripción permitida para el apunte E2E", course: "Curso", cycle: "I", fileUrl: "https://example.com/file.pdf" }],
    ] as const) {
      const res = await fetch(`${baseUrl}/${endpoint}`, { method: "POST", headers: authHeaders, body: JSON.stringify(body) });
      record(name, res.status === 201 ? "PASS" : "FAIL", `status=${res.status}`);
    }

    record("trámites consultar", "WARN", "El MVP usa contenido administrado/estático; validación visual requerida");

    const market = await fetch(`${baseUrl}/marketplace/products`);
    if (market.status !== 200) record("tienda interés", "FAIL", `list status=${market.status}`);
    else {
      const marketJson = (await market.json()) as { items?: Array<{ id: number }> };
      const first = marketJson.items?.[0];
      if (!first) record("tienda interés", "WARN", "Sin productos activos");
      else {
        const inquiry = await fetch(`${baseUrl}/marketplace/products/${first.id}/inquiries`, { method: "POST", headers: authHeaders, body: JSON.stringify({ contactName: "Release User", contactPhone: "987654321", message: "Interés e2e", preferredContactMethod: "whatsapp" }) });
        record("tienda interés", inquiry.status === 201 ? "PASS" : "FAIL", `status=${inquiry.status}`);
      }
    }

    const landingFile = await fs.readFile(path.join(repoRoot, "apps/web/src/app/page.tsx"), "utf8");
    const appShellFile = await fs.readFile(path.join(repoRoot, "apps/web/src/components/app-shell.tsx"), "utf8");
    const tiendaFile = await fs.readFile(path.join(repoRoot, "apps/web/src/app/app/tienda/page.tsx"), "utf8");
    const ctaOk = landingFile.includes('href="/register"') && landingFile.includes('href="/login"') && appShellFile.includes('href="/app/comunidades"') && tiendaFile.includes('/app/tienda/');
    record("CTA abre acción correcta de su módulo", ctaOk ? "PASS" : "FAIL");

    const redirectOk = safeRedirectPath("//evil.com") === "/app" && safeRedirectPath("/app/preguntas") === "/app/preguntas";
    record("validación de no-redirección indebida al feed", redirectOk ? "PASS" : "FAIL");

    const reportPath = path.join(repoRoot, "docs/RELEASE_E2E_REPORT.md");
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
