import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { RateLimitGuard } from "../modules/core/rate-limit.guard";

type CheckStatus = "PASS" | "FAIL" | "SKIP";
type CheckResult = { area: string; name: string; status: CheckStatus; details?: string };

const results: CheckResult[] = [];

function record(area: string, name: string, status: CheckStatus, details?: string) {
  results.push({ area, name, status, details });
  const icon = status === "PASS" ? "✅" : status === "SKIP" ? "⚠️" : "❌";
  const suffix = details ? ` — ${details}` : "";
  console.log(`${icon} [${area}] ${name}${suffix}`);
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function assertStatus(actual: number, expected: number, context: string) {
  if (actual !== expected) throw new Error(`${context}: expected ${expected}, received ${actual}`);
}

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix("api");
  app.useGlobalGuards(app.get(RateLimitGuard));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  await app.listen(0);
  const address = app.getHttpServer().address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  const seed = Date.now();
  const emailA = `moments.${seed}.a@crunedu.local`;
  const emailB = `moments.${seed}.b@crunedu.local`;
  const password = "CrunEdu123!";

  try {
    // --- register & login two users ---
    await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: emailA, password, firstName: "Moment", lastName: "AA" }),
    });
    await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: emailB, password, firstName: "Moment", lastName: "BB" }),
    });
    const loginA = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: emailA, password }),
    });
    const authA = (await loginA.json()) as { accessToken: string };
    const headerA = { authorization: `Bearer ${authA.accessToken}`, "content-type": "application/json" };

    const loginB = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: emailB, password }),
    });
    const authB = (await loginB.json()) as { accessToken: string };
    const headerB = { authorization: `Bearer ${authB.accessToken}`, "content-type": "application/json" };

    record("auth", "registro y login de 2 usuarios", "PASS");

    // --- create moment requires token ---
    const createNoToken = await fetch(`${baseUrl}/moments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "sin token", description: "debe fallar" }),
    });
    assertStatus(createNoToken.status, 401, "create moment without token");
    record("moments", "POST /moments sin token devuelve 401", "PASS");

    // --- validation: missing title ---
    const badCreate = await fetch(`${baseUrl}/moments`, {
      method: "POST",
      headers: headerA,
      body: JSON.stringify({ description: "falta título" }),
    });
    assertStatus(badCreate.status, 400, "create moment missing title");
    record("moments", "validación de campos obligatorios", "PASS");

    // --- create moment ---
    const createRes = await fetch(`${baseUrl}/moments`, {
      method: "POST",
      headers: headerA,
      body: JSON.stringify({
        title: "Cola en comedor",
        description: "Se está llenando rápido antes del mediodía.",
        type: "FOOD",
        location: "Comedor",
        tags: ["Comedor", "Aviso"],
        durationHours: 24,
      }),
    });
    assertStatus(createRes.status, 201, "create moment");
    const created = (await createRes.json()) as { id: string; title: string; type: string; tags: string[]; stats: { boosts: number } };
    assert(created.title === "Cola en comedor", "title preserved");
    assert(created.type === "food", "type lowercased");
    assert(created.tags.length === 2, "tags created");
    assert(created.stats.boosts === 0, "initial boost count 0");
    record("moments", "crear momento real con tags y tipo", "PASS");

    // --- list moments ---
    const listRes = await fetch(`${baseUrl}/moments`);
    assertStatus(listRes.status, 200, "list moments");
    const listJson = (await listRes.json()) as { items: unknown[]; nextCursor: number | null };
    assert(Array.isArray(listJson.items), "list returns items array");
    record("moments", "GET /moments responde 200 con items", "PASS");

    // --- detail ---
    const detailRes = await fetch(`${baseUrl}/moments/${created.id}`);
    assertStatus(detailRes.status, 200, "moment detail");
    const detail = (await detailRes.json()) as { id: string; recentComments: unknown[]; stats: { views: number } };
    assert(detail.id === created.id, "detail id matches");
    assert(Array.isArray(detail.recentComments), "detail includes recentComments");
    assert(detail.stats.views >= 1, "detail increments views");
    record("moments", "GET /moments/:id devuelve detalle con comentarios recientes", "PASS");

    // --- nonexistent moment ---
    const notFound = await fetch(`${baseUrl}/moments/9999999`);
    assertStatus(notFound.status, 404, "nonexistent moment");
    record("moments", "momento inexistente devuelve 404", "PASS");

    // --- boost (unique) ---
    const boost1 = await fetch(`${baseUrl}/moments/${created.id}/boost`, { method: "POST", headers: headerA });
    assertStatus(boost1.status, 201, "boost");
    const boost1Json = (await boost1.json()) as { boosted: boolean; count: number };
    assert(boost1Json.boosted === true && boost1Json.count === 1, "boost registered");

    const boost2 = await fetch(`${baseUrl}/moments/${created.id}/boost`, { method: "POST", headers: headerA });
    assertStatus(boost2.status, 400, "double boost rejected");
    record("moments", "impulso único por usuario (doble rechazado)", "PASS");

    // --- unboost ---
    const unboost = await fetch(`${baseUrl}/moments/${created.id}/boost`, { method: "DELETE", headers: headerA });
    assertStatus(unboost.status, 200, "unboost");
    const unboostJson = (await unboost.json()) as { boosted: boolean; count: number };
    assert(unboostJson.count === 0, "boost count back to 0");
    record("moments", "desimpulsar reduce el conteo", "PASS");

    // --- confirm (unique) ---
    const confirm1 = await fetch(`${baseUrl}/moments/${created.id}/confirm`, { method: "POST", headers: headerB });
    assertStatus(confirm1.status, 201, "confirm");
    const confirm2 = await fetch(`${baseUrl}/moments/${created.id}/confirm`, { method: "POST", headers: headerB });
    assertStatus(confirm2.status, 400, "double confirm rejected");
    record("moments", "confirmación única por usuario", "PASS");

    // --- save / unsave ---
    const saveRes = await fetch(`${baseUrl}/moments/${created.id}/save`, { method: "POST", headers: headerB });
    assertStatus(saveRes.status, 201, "save");
    const saved = await fetch(`${baseUrl}/moments/saved`, { headers: headerB });
    assertStatus(saved.status, 200, "saved list");
    const savedJson = (await saved.json()) as { items: { id: string }[] };
    assert(savedJson.items.some((i) => i.id === created.id), "saved list contains moment");

    const unsaveRes = await fetch(`${baseUrl}/moments/${created.id}/save`, { method: "DELETE", headers: headerB });
    assertStatus(unsaveRes.status, 200, "unsave");
    record("moments", "guardar y quitar de guardados", "PASS");

    // --- share ---
    const shareRes = await fetch(`${baseUrl}/moments/${created.id}/share`, { method: "POST" });
    assertStatus(shareRes.status, 201, "share");
    const shareJson = (await shareRes.json()) as { shares: number };
    assert(shareJson.shares >= 1, "share incremented");
    record("moments", "compartir incrementa el contador", "PASS");

    // --- comments ---
    const commentRes = await fetch(`${baseUrl}/moments/${created.id}/comments`, {
      method: "POST",
      headers: headerB,
      body: JSON.stringify({ content: "Confirmo, pasó lo mismo hoy." }),
    });
    assertStatus(commentRes.status, 201, "create comment");
    const comment = (await commentRes.json()) as { id: string };

    const listComments = await fetch(`${baseUrl}/moments/${created.id}/comments`);
    assertStatus(listComments.status, 200, "list comments");
    const commentsJson = (await listComments.json()) as { id: string }[];
    assert(commentsJson.length >= 1, "comments list has items");

    const delComment = await fetch(`${baseUrl}/moments/${created.id}/comments/${comment.id}`, { method: "DELETE", headers: headerB });
    assertStatus(delComment.status, 200, "delete comment");
    record("moments", "crear, listar y eliminar comentario", "PASS");

    // --- update permissions ---
    const updateByOwner = await fetch(`${baseUrl}/moments/${created.id}`, {
      method: "PATCH",
      headers: headerA,
      body: JSON.stringify({ title: "Cola actualizada" }),
    });
    assertStatus(updateByOwner.status, 200, "update by owner");
    const updatedJson = (await updateByOwner.json()) as { title: string };
    assert(updatedJson.title === "Cola actualizada", "title updated");

    const updateByOther = await fetch(`${baseUrl}/moments/${created.id}`, {
      method: "PATCH",
      headers: headerB,
      body: JSON.stringify({ title: "hack" }),
    });
    assertStatus(updateByOther.status, 403, "update by non-owner forbidden");
    record("moments", "permisos de edición (autor vs otro)", "PASS");

    // --- delete permissions ---
    const deleteByOther = await fetch(`${baseUrl}/moments/${created.id}`, { method: "DELETE", headers: headerB });
    assertStatus(deleteByOther.status, 403, "delete by non-owner forbidden");
    record("moments", "permisos de eliminación (no autor 403)", "PASS");

    // --- news / gallery / trends / topics ---
    const news = await fetch(`${baseUrl}/moments/news`);
    assertStatus(news.status, 200, "news");
    assert(Array.isArray((await news.clone().json()).items), "news returns items");

    const gallery = await fetch(`${baseUrl}/moments/gallery`);
    assertStatus(gallery.status, 200, "gallery");

    const trends = await fetch(`${baseUrl}/moments/trends`);
    assertStatus(trends.status, 200, "trends");

    const topics = await fetch(`${baseUrl}/moments/topics`);
    assertStatus(topics.status, 200, "topics");
    record("moments", "news, galería, tendencias y temas responden 200", "PASS");

    // --- invalid file upload ---
    const invalidUpload = await fetch(`${baseUrl}/moments/media`, {
      method: "POST",
      headers: { authorization: `Bearer ${authA.accessToken}` },
      body: (() => { const fd = new FormData(); fd.append("file", new Blob(["not an image"], { type: "text/plain" }), "bad.txt"); return fd; })(),
    });
    assertStatus(invalidUpload.status, 400, "invalid file upload");
    record("moments", "subida de archivo inválido rechazada", "PASS");

    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;
    console.log(`\nResumen Momentos: PASS=${passed} FAIL=${failed}`);
    console.log("Moments smoke tests passed.");
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  record("suite", "ejecución general", "FAIL", error instanceof Error ? error.message : String(error));
  console.error("Moments smoke tests failed:", error);
  process.exit(1);
});
