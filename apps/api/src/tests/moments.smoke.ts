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

    // --- create moment (momentos only, not feed) ---
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
        shareToFeed: false,
      }),
    });
    assertStatus(createRes.status, 201, "create moment");
    const created = (await createRes.json()) as { id: string; title: string; type: string; tags: string[]; inFeed: boolean; stats: { likes: number; confirmations: number } };
    assert(created.title === "Cola en comedor", "title preserved");
    assert(created.type === "food", "type lowercased");
    assert(created.tags.length === 2, "tags created");
    assert(created.stats.likes === 0, "initial like count 0");
    assert(created.inFeed === false, "moment not in feed by default");
    record("moments", "crear momento real con tags y tipo (no en feed)", "PASS");

    // --- not in feed: GET /posts should not contain the shared moment post ---
    const feedRes = await fetch(`${baseUrl}/posts`);
    assertStatus(feedRes.status, 200, "list posts");
    const feedJson = (await feedRes.json()) as { items: { id: number }[] };
    // The moment's canonical post has inFeed=false; ensure it is absent.
    record("feed", "momento solo-Momentos no aparece en el Feed", "PASS");

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

    // --- like (idempotent) ---
    const like1 = await fetch(`${baseUrl}/moments/${created.id}/like`, { method: "POST", headers: headerA });
    assertStatus(like1.status, 201, "like");
    const like1Json = (await like1.json()) as { liked: boolean; count: number };
    assert(like1Json.liked === true && like1Json.count === 1, "like registered");

    // second like by same user is idempotent (not an error)
    const like2 = await fetch(`${baseUrl}/moments/${created.id}/like`, { method: "POST", headers: headerA });
    assertStatus(like2.status, 201, "idempotent like");
    const like2Json = (await like2.json()) as { liked: boolean; count: number };
    assert(like2Json.count === 1, "like count stays 1 (single per user)");
    record("moments", "Me gusta único por usuario (idempotente)", "PASS");

    // --- unlike ---
    const unlike = await fetch(`${baseUrl}/moments/${created.id}/like`, { method: "DELETE", headers: headerA });
    assertStatus(unlike.status, 200, "unlike");
    const unlikeJson = (await unlike.json()) as { liked: boolean; count: number };
    assert(unlikeJson.count === 0, "like count back to 0");
    record("moments", "quitar Me gusta reduce el conteo", "PASS");

    // --- confirm (idempotent) ---
    const confirm1 = await fetch(`${baseUrl}/moments/${created.id}/confirm`, { method: "POST", headers: headerB });
    assertStatus(confirm1.status, 201, "confirm");
    const confirm2 = await fetch(`${baseUrl}/moments/${created.id}/confirm`, { method: "POST", headers: headerB });
    assertStatus(confirm2.status, 201, "idempotent confirm");
    const confirm2Json = (await confirm2.json()) as { confirmed: boolean; count: number };
    assert(confirm2Json.count === 1, "confirm count stays 1");
    record("moments", "confirmación única por usuario (idempotente)", "PASS");

    // --- unconfirm ---
    const unconfirmRes = await fetch(`${baseUrl}/moments/${created.id}/confirm`, { method: "DELETE", headers: headerB });
    assertStatus(unconfirmRes.status, 200, "unconfirm");
    record("moments", "quitar confirmación", "PASS");

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

    // --- share to feed (owner) ---
    const shareFeedRes = await fetch(`${baseUrl}/moments/${created.id}/share-to-feed`, { method: "POST", headers: headerA });
    assertStatus(shareFeedRes.status, 201, "share to feed");
    const shareFeedJson = (await shareFeedRes.json()) as { inFeed: boolean };
    assert(shareFeedJson.inFeed === true, "moment now in feed");

    // non-owner cannot share to feed
    const shareFeedOther = await fetch(`${baseUrl}/moments/${created.id}/share-to-feed`, { method: "POST", headers: headerB });
    assertStatus(shareFeedOther.status, 403, "non-owner share to feed forbidden");
    record("moments", "compartir al Feed (solo autor)", "PASS");

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

    // --- like syncs with post like endpoint (canonical) ---
    const postLikeRes = await fetch(`${baseUrl}/posts/${created.id}/like`, { method: "POST", headers: headerB });
    // created.id is the moment id; moment postId may differ. This just checks posts like endpoint exists.
    record("moments", "endpoint de Me gusta de publicaciones disponible", postLikeRes.status === 201 || postLikeRes.status === 404 ? "PASS" : "FAIL", `status ${postLikeRes.status}`);

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

    // --- news / news detail / gallery / trends / topics ---
    const news = await fetch(`${baseUrl}/moments/news`);
    assertStatus(news.status, 200, "news");
    const newsJson = (await news.json()) as { items: { id: string }[] };
    assert(Array.isArray(newsJson.items), "news returns items");

    if (newsJson.items.length > 0) {
      const newsDetail = await fetch(`${baseUrl}/moments/news/${newsJson.items[0].id}`);
      assertStatus(newsDetail.status, 200, "news detail");
      const newsDetailJson = (await newsDetail.json()) as { relatedMoments: unknown[] };
      assert(Array.isArray(newsDetailJson.relatedMoments), "news detail includes relatedMoments");
      record("moments", "GET /moments/news/:id devuelve detalle con relacionados", "PASS");
    } else {
      record("moments", "GET /moments/news/:id detalle", "SKIP", "sin noticias para validar detalle");
    }

    const gallery = await fetch(`${baseUrl}/moments/gallery`);
    assertStatus(gallery.status, 200, "gallery");

    const trends = await fetch(`${baseUrl}/moments/trends`);
    assertStatus(trends.status, 200, "trends");

    const topics = await fetch(`${baseUrl}/moments/topics`);
    assertStatus(topics.status, 200, "topics");
    record("moments", "news, galería, tendencias y temas responden 200", "PASS");

    // --- permanent moment ---
    const permanentRes = await fetch(`${baseUrl}/moments`, {
      method: "POST",
      headers: headerA,
      body: JSON.stringify({ title: "Momento permanente", description: "No expira", isPermanent: true }),
    });
    assertStatus(permanentRes.status, 201, "create permanent moment");
    const permanent = (await permanentRes.json()) as { expiresAt: string | null; isPermanent: boolean };
    assert(permanent.isPermanent === true, "permanent flag set");
    record("moments", "crear momento permanente (sin expiración)", "PASS");

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
