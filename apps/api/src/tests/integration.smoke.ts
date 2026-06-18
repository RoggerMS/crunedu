import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { RateLimitGuard } from "../modules/core/rate-limit.guard";

type CheckStatus = "PASS" | "FAIL" | "SKIP";

type CheckResult = {
  area: string;
  name: string;
  status: CheckStatus;
  details?: string;
};

const results: CheckResult[] = [];

function record(area: string, name: string, status: CheckStatus, details?: string) {
  results.push({ area, name, status, details });
  const icon = status === "PASS" ? "✅" : status === "SKIP" ? "⚠️" : "❌";
  const suffix = details ? ` — ${details}` : "";
  console.log(`${icon} [${area}] ${name}${suffix}`);
}

function assertStatus(actual: number, expected: number, context: string) {
  if (actual !== expected) {
    throw new Error(`${context}: expected ${expected}, received ${actual}`);
  }
}

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.get(ConfigService);
  app.setGlobalPrefix("api");
  app.useGlobalGuards(app.get(RateLimitGuard));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  await app.listen(0);
  const address = app.getHttpServer().address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  const seed = Date.now();
  const firstUserEmail = `integration.${seed}.a@crunedu.local`;
  const secondUserEmail = `integration.${seed}.b@crunedu.local`;
  const password = "CrunEdu123!";

  try {
    // Auth register/login
    const registerA = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: firstUserEmail, password, firstName: "Inte", lastName: "AA" }),
    });
    assertStatus(registerA.status, 201, "register A");

    const registerB = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: secondUserEmail, password, firstName: "Inte", lastName: "BB" }),
    });
    assertStatus(registerB.status, 201, "register B");

    const loginA = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: firstUserEmail, password }),
    });
    assertStatus(loginA.status, 201, "login A");
    const authA = (await loginA.json()) as { accessToken: string };
    const authHeaderA = { authorization: `Bearer ${authA.accessToken}`, "content-type": "application/json" };

    const loginB = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: secondUserEmail, password }),
    });
    assertStatus(loginB.status, 201, "login B");
    const authB = (await loginB.json()) as { accessToken: string };
    const authHeaderB = { authorization: `Bearer ${authB.accessToken}`, "content-type": "application/json" };

    record("auth", "registro y login de 2 usuarios", "PASS");

    const badLogin = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: firstUserEmail, password: "CrunEdu123?" }),
    });
    assertStatus(badLogin.status, 401, "invalid login");
    record("auth", "login inválido devuelve 401", "PASS");

    // Basic posts/comments/questions (smoke preserved)
    const postsBefore = await fetch(`${baseUrl}/posts`);
    assertStatus(postsBefore.status, 200, "list posts");
    record("posts", "GET /posts responde 200", "PASS");

    const createPostNoToken = await fetch(`${baseUrl}/posts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "sin token", content: "debe fallar", communityId: 1 }),
    });
    assertStatus(createPostNoToken.status, 401, "create post without token");
    record("auth", "POST /posts sin token devuelve 401", "PASS");

    const createPost = await fetch(`${baseUrl}/posts`, {
      method: "POST",
      headers: authHeaderA,
      body: JSON.stringify({ title: "Post integración", content: "Contenido de prueba para integración", communityId: 1 }),
    });
    assertStatus(createPost.status, 201, "create post");
    const createdPost = (await createPost.json()) as { id: number };
    record("posts", "POST /posts con token crea publicación", "PASS");

    const createCommentRes = await fetch(`${baseUrl}/posts/${createdPost.id}/comments`, {
      method: "POST",
      headers: authHeaderA,
      body: JSON.stringify({ content: "Comentario útil de integración académica" }),
    });
    assertStatus(createCommentRes.status, 201, "create comment");

    const listCommentsRes = await fetch(`${baseUrl}/posts/${createdPost.id}/comments`);
    assertStatus(listCommentsRes.status, 200, "list comments");
    record("comments", "crear y listar comentario", "PASS");

    // Follow / friend status coverage
    const userAMe = await fetch(`${baseUrl}/users/me`, { headers: { authorization: `Bearer ${authA.accessToken}` } });
    assertStatus(userAMe.status, 200, "get me A");
    const userA = (await userAMe.json()) as { id: number };

    const userBMe = await fetch(`${baseUrl}/users/me`, { headers: { authorization: `Bearer ${authB.accessToken}` } });
    assertStatus(userBMe.status, 200, "get me B");
    const userB = (await userBMe.json()) as { id: number };

    const followRes = await fetch(`${baseUrl}/follows/${userB.id}`, { method: "POST", headers: authHeaderA });
    assertStatus(followRes.status, 201, "follow user A->B");

    const followBackRes = await fetch(`${baseUrl}/follows/${userA.id}`, { method: "POST", headers: authHeaderB });
    assertStatus(followBackRes.status, 201, "follow user B->A");

    const profileAfterMutual = await fetch(`${baseUrl}/users/${userB.id}`, { headers: { authorization: `Bearer ${authA.accessToken}` } });
    assertStatus(profileAfterMutual.status, 200, "profile after mutual follow");
    const profileAfterMutualJson = (await profileAfterMutual.json()) as {
      relationship?: { isFollowing?: boolean; isFriend?: boolean };
    };
    if (!profileAfterMutualJson.relationship?.isFollowing) throw new Error("relationship.isFollowing should be true after follow");
    if (!profileAfterMutualJson.relationship?.isFriend) throw new Error("relationship.isFriend should be true after mutual follow");

    const profileFromB = await fetch(`${baseUrl}/users/${userA.id}`, { headers: { authorization: `Bearer ${authB.accessToken}` } });
    assertStatus(profileFromB.status, 200, "profile B sees A");
    const profileFromBJson = (await profileFromB.json()) as { relationship?: { isFollowing?: boolean; isFriend?: boolean } };
    if (!profileFromBJson.relationship?.isFriend) throw new Error("relationship.isFriend should be true from both sides");
    record("follows", "follow mutuo refleja estado isFriend en ambos perfiles", "PASS");

    const friendsList = await fetch(`${baseUrl}/users/${userB.id}/friends`, { headers: { authorization: `Bearer ${authA.accessToken}` } });
    assertStatus(friendsList.status, 200, "friends list");
    record("follows", "GET /users/:id/friends responde 200", "PASS");

    const unfollowRes = await fetch(`${baseUrl}/follows/${userB.id}`, { method: "DELETE", headers: authHeaderA });
    assertStatus(unfollowRes.status, 200, "unfollow user A->B");

    const profileAfterUnfollow = await fetch(`${baseUrl}/users/${userB.id}`, { headers: { authorization: `Bearer ${authA.accessToken}` } });
    assertStatus(profileAfterUnfollow.status, 200, "profile after unfollow");
    const profileAfterUnfollowJson = (await profileAfterUnfollow.json()) as {
      relationship?: { isFollowing?: boolean; isFriend?: boolean };
    };
    if (profileAfterUnfollowJson.relationship?.isFollowing) throw new Error("relationship.isFollowing should be false after unfollow");
    if (profileAfterUnfollowJson.relationship?.isFriend) throw new Error("relationship.isFriend should be false after unfollow");
    record("follows", "unfollow actualiza estado de relación", "PASS");

    // Comment limits (8/min user)
    for (let i = 0; i < 7; i += 1) {
      const comment = await fetch(`${baseUrl}/posts/${createdPost.id}/comments`, {
        method: "POST",
        headers: authHeaderA,
        body: JSON.stringify({ content: `Comentario académico de límite ${i}` }),
      });
      assertStatus(comment.status, 201, `comment ${i}`);
    }
    const commentLimit = await fetch(`${baseUrl}/posts/${createdPost.id}/comments`, {
      method: "POST",
      headers: authHeaderA,
      body: JSON.stringify({ content: "Comentario límite final" }),
    });
    assertStatus(commentLimit.status, 429, "comment rate limit");
    record("comments", "rate limit de comentarios devuelve 429", "PASS");

    // Auth rate limit (register: 5/min per IP)
    for (let i = 0; i < 3; i += 1) {
      const register = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: `integration.${seed}.spam${i}@crunedu.local`, password, firstName: "Spam", lastName: `S${i}` }),
      });
      assertStatus(register.status, 201, `register rate iteration ${i}`);
    }
    const registerLimit = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: `integration.${seed}.spam-limit@crunedu.local`, password, firstName: "Spam", lastName: "Limit" }),
    });
    assertStatus(registerLimit.status, 429, "register rate limit");
    record("auth", "rate limit de registro devuelve 429", "PASS");

    
    // Marketplace minimal flow
    const marketplaceList = await fetch(`${baseUrl}/marketplace/products`);
    assertStatus(marketplaceList.status, 200, "marketplace list");
    const marketplaceListJson = (await marketplaceList.json()) as { items?: Array<{ id: number }>; featuredProducts?: unknown[]; context?: unknown; nextCursor?: number | null };
    if (!Array.isArray(marketplaceListJson.items)) throw new Error("marketplace list must return items array");
    if (!Array.isArray(marketplaceListJson.featuredProducts)) throw new Error("marketplace list must return featuredProducts array");

    if (marketplaceListJson.items.length > 0) {
      const productId = marketplaceListJson.items[0].id;
      const productDetail = await fetch(`${baseUrl}/marketplace/products/${productId}`);
      assertStatus(productDetail.status, 200, "marketplace detail");

      const inquiryNoToken = await fetch(`${baseUrl}/marketplace/products/${productId}/inquiries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contactName: "Usuario Integración",
          contactPhone: "987654321",
          message: "Estoy interesado en este producto",
          preferredContactMethod: "whatsapp",
        }),
      });
      assertStatus(inquiryNoToken.status, 401, "marketplace inquiry without token");

      const inquiryWithToken = await fetch(`${baseUrl}/marketplace/products/${productId}/inquiries`, {
        method: "POST",
        headers: authHeaderA,
        body: JSON.stringify({
          contactName: "Usuario Integración",
          contactPhone: "987654321",
          message: "Estoy interesado en este producto",
          preferredContactMethod: "whatsapp",
        }),
      });
      assertStatus(inquiryWithToken.status, 201, "marketplace inquiry with token");
      record("marketplace", "flujo mínimo listar/detalle/consulta autenticada", "PASS");
    } else {
      record("marketplace", "flujo mínimo listar/detalle/consulta autenticada", "SKIP", "No hay productos activos para validar detalle e inquiry");
    }

    record("questions", "cobertura manual pendiente en este smoke (ver checklist)", "SKIP", "prioridad en auth/posts/comments/follows para MVP");

    const passed = results.filter((item) => item.status === "PASS").length;
    const failed = results.filter((item) => item.status === "FAIL").length;
    const skipped = results.filter((item) => item.status === "SKIP").length;
    console.log(`\nResumen: PASS=${passed} FAIL=${failed} SKIP=${skipped}`);
    console.log("Integration smoke tests passed.");
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  record("suite", "ejecución general", "FAIL", error instanceof Error ? error.message : String(error));
  console.error("Integration smoke tests failed:", error);
  process.exit(1);
});
