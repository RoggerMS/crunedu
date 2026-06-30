import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { RateLimitGuard } from "../modules/core/rate-limit.guard";

type CheckStatus = "PASS" | "FAIL" | "SKIP";
type CheckResult = { area: string; name: string; status: CheckStatus; details?: string };

const results: CheckResult[] = [];

function record(area: string, name: string, status: CheckStatus, details?: string) {
  results.push({ area, name, status, details });
  const icon = status === "PASS" ? "âœ…" : status === "SKIP" ? "âš ï¸" : "âŒ";
  const suffix = details ? ` â€” ${details}` : "";
  console.log(`${icon} [${area}] ${name}${suffix}`);
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
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
  const emailA = `conv.${seed}.a@crunedu.local`;
  const emailB = `conv.${seed}.b@crunedu.local`;
  const password = "CrunEdu123!";

  try {
    // Register + login two users
    await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: emailA, password, firstName: "Conv", lastName: "Alpha" }),
    });
    await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: emailB, password, firstName: "Conv", lastName: "Beta" }),
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

    record("Auth", "Register + login two users", "PASS");

    // --- Create conversation ---
    const createRes = await fetch(`${baseUrl}/conversations`, {
      method: "POST",
      headers: headerA,
      body: JSON.stringify({
        title: "ConversaciÃ³n de prueba para tests",
        description: "DescripciÃ³n de prueba con suficiente longitud para validar.",
        category: "MatemÃ¡tica",
        type: "STUDY",
        visibility: "PUBLIC",
        maxParticipants: 20,
        maxSpeakers: 5,
        tags: ["test", "prueba"],
      }),
    });
    assert(createRes.status === 201, `Create expected 201, got ${createRes.status}`);
    const conv = (await createRes.json()) as { id: number; status: string; type: string; slug: string };
    record("Create", "Create conversation", "PASS", `id=${conv.id} status=${conv.status}`);

    // --- Validation: short title ---
    const badCreate = await fetch(`${baseUrl}/conversations`, {
      method: "POST",
      headers: headerA,
      body: JSON.stringify({ title: "x", description: "demasiado corta", category: "Test" }),
    });
    assert(badCreate.status === 400, "Validation should reject short title");
    record("Validation", "Reject short title", "PASS");

    // --- Validation: debate needs 2 stances ---
    const badDebate = await fetch(`${baseUrl}/conversations`, {
      method: "POST",
      headers: headerA,
      body: JSON.stringify({ title: "Debate de prueba vÃ¡lido", description: "DescripciÃ³n suficiente para el debate.", category: "Test", type: "DEBATE", initialStances: [{ title: "Solo una" }] }),
    });
    assert(badDebate.status === 400, "Debate with <2 stances should fail");
    record("Validation", "Debate needs 2+ stances", "PASS");

    // --- List ---
    const listRes = await fetch(`${baseUrl}/conversations`);
    const list = (await listRes.json()) as { items: unknown[] };
    assert(list.items.length > 0, "List should have items");
    record("List", "List conversations", "PASS", `count=${list.items.length}`);

    // --- Filter by type ---
    const filterRes = await fetch(`${baseUrl}/conversations?type=STUDY`);
    const filtered = (await filterRes.json()) as { items: Array<{ type: string }> };
    assert(filtered.items.every((i) => i.type === "STUDY"), "Filter by type should work");
    record("Filter", "Filter by type", "PASS");

    // --- Detail ---
    const detailRes = await fetch(`${baseUrl}/conversations/${conv.id}`);
    assert(detailRes.status === 200, "Detail should return 200");
    const detail = (await detailRes.json()) as { id: number; title: string };
    assert(detail.id === conv.id, "Detail id should match");
    record("Detail", "Get conversation detail", "PASS");

    // --- Edit as owner ---
    const editRes = await fetch(`${baseUrl}/conversations/${conv.id}`, {
      method: "PATCH",
      headers: headerA,
      body: JSON.stringify({ title: "TÃ­tulo editado de prueba" }),
    });
    assert(editRes.status === 200, "Edit as owner should succeed");
    const edited = (await editRes.json()) as { title: string };
    assert(edited.title === "TÃ­tulo editado de prueba", "Title should be updated");
    record("Edit", "Edit as owner", "PASS");

    // --- Edit as non-owner (should fail) ---
    const editFail = await fetch(`${baseUrl}/conversations/${conv.id}`, {
      method: "PATCH",
      headers: headerB,
      body: JSON.stringify({ title: "Hackeado" }),
    });
    assert(editFail.status === 403, "Non-owner edit should be forbidden");
    record("Permissions", "Prevent non-owner edit", "PASS");

    // --- Join as user A (host) ---
    const joinA = await fetch(`${baseUrl}/conversations/${conv.id}/join`, {
      method: "POST",
      headers: headerA,
      body: JSON.stringify({}),
    });
    if (joinA.status !== 200 && joinA.status !== 201) {
      const errBody = await joinA.text().catch(() => "");
      record("Join", "Host joins and gets token", "FAIL", `status=${joinA.status} body=${errBody.slice(0, 200)}`);
    } else {
      const joinDataA = (await joinA.json()) as { role: string; token: string; livekitUrl: string };
      assert(joinDataA.role === "HOST", `A should be HOST, got ${joinDataA.role}`);
      assert(joinDataA.token.length > 50, "Token should be generated");
      record("Join", "Host joins and gets token", "PASS", `role=${joinDataA.role} tokenLen=${joinDataA.token.length}`);
    }

    // --- Start conversation ---
    const startRes = await fetch(`${baseUrl}/conversations/${conv.id}/start`, {
      method: "POST",
      headers: headerA,
    });
    if (startRes.status !== 200 && startRes.status !== 201) {
      const errBody = await startRes.text().catch(() => "");
      record("Lifecycle", "Start conversation", "FAIL", `status=${startRes.status} body=${errBody.slice(0, 200)}`);
    } else {
      const started = (await startRes.json()) as { status: string };
      assert(started.status === "LIVE", "Status should be LIVE");
      record("Lifecycle", "Start conversation", "PASS");
    }

    // --- Join as user B (listener) ---
    const joinB = await fetch(`${baseUrl}/conversations/${conv.id}/join`, {
      method: "POST",
      headers: headerB,
      body: JSON.stringify({}),
    });
    assert(joinB.status === 200 || joinB.status === 201, "Join B should succeed");
    const joinDataB = (await joinB.json()) as { role: string; token: string };
    assert(joinDataB.role === "LISTENER", `B should be LISTENER, got ${joinDataB.role}`);
    assert(joinDataB.token.length > 50, "B token should be generated");
    record("Join", "Listener joins public conversation", "PASS", `role=${joinDataB.role}`);

    // --- Speaker request ---
    const raiseRes = await fetch(`${baseUrl}/conversations/${conv.id}/speaker-requests`, {
      method: "POST",
      headers: headerB,
    });
    assert(raiseRes.status === 200 || raiseRes.status === 201, "Raise hand should succeed");
    record("SpeakerRequest", "Listener raises hand", "PASS");

    // --- Host sees requests ---
    const reqList = await fetch(`${baseUrl}/conversations/${conv.id}/speaker-requests`, {
      headers: headerA,
    });
    const reqs = (await reqList.json()) as Array<{ id: number; status: string; userId: number }>;
    assert(reqs.length > 0, "Host should see requests");
    record("SpeakerRequest", "Host sees pending requests", "PASS", `count=${reqs.length}`);

    // --- Approve request ---
    const pendingReq = reqs.find((r) => r.status === "PENDING");
    if (pendingReq) {
      const approveRes = await fetch(`${baseUrl}/conversations/${conv.id}/speaker-requests/${pendingReq.id}/approve`, {
        method: "POST",
        headers: headerA,
      });
      assert(approveRes.status === 200 || approveRes.status === 201, "Approve should succeed");
      record("SpeakerRequest", "Approve speaker request", "PASS");
    } else {
      record("SpeakerRequest", "Approve speaker request", "SKIP", "No pending request found");
    }

    // --- Companions ---
    const companionRes = await fetch(`${baseUrl}/conversation-companions/me`, { headers: headerB });
    assert(companionRes.status === 200, "Get companion profile should work");
    record("Companions", "Get my companion profile", "PASS");

    const upsertCompanion = await fetch(`${baseUrl}/conversation-companions/me`, {
      method: "PUT",
      headers: headerB,
      body: JSON.stringify({ description: "Ayudo con estudios", topics: ["MatemÃ¡tica"], availableForVoice: true, isActive: true }),
    });
    assert(upsertCompanion.status === 200 || upsertCompanion.status === 201, "Upsert companion should work");
    record("Companions", "Upsert companion profile", "PASS");

    const listCompanions = await fetch(`${baseUrl}/conversation-companions`);
    const companions = (await listCompanions.json()) as { items: unknown[] };
    assert(companions.items.length > 0, "Companions list should have items");
    record("Companions", "List companions", "PASS", `count=${companions.items.length}`);

    // --- Links ---
    const linkRes = await fetch(`${baseUrl}/conversations/${conv.id}/links`, {
      method: "POST",
      headers: headerA,
      body: JSON.stringify({ title: "Recurso externo", url: "https://drive.google.com/test", type: "DOCUMENT" }),
    });
    assert(linkRes.status === 200 || linkRes.status === 201, "Create link should work");
    record("Links", "Create shared link", "PASS");

    // --- End conversation ---
    const endRes = await fetch(`${baseUrl}/conversations/${conv.id}/end`, {
      method: "POST",
      headers: headerA,
    });
    assert(endRes.status === 200 || endRes.status === 201, "End should succeed");
    const ended = (await endRes.json()) as { status: string };
    assert(ended.status === "ENDED", "Status should be ENDED");
    record("Lifecycle", "End conversation", "PASS");

    // --- Cleanup: delete conversation ---
    const delRes = await fetch(`${baseUrl}/conversations/${conv.id}`, {
      method: "DELETE",
      headers: headerA,
    });
    assert(delRes.status === 200, "Delete should succeed");
    record("Cleanup", "Delete conversation", "PASS");

    // --- Create debate with stances ---
    const debateRes = await fetch(`${baseUrl}/conversations`, {
      method: "POST",
      headers: headerA,
      body: JSON.stringify({
        title: "Debate formal de prueba para tests",
        description: "DescripciÃ³n suficiente para validar el debate formal con posturas.",
        category: "TecnologÃ­a / EducaciÃ³n",
        type: "DEBATE",
        visibility: "PUBLIC",
        initialStances: [{ title: "A favor" }, { title: "En contra" }],
      }),
    });
    assert(debateRes.status === 201, "Debate creation should succeed");
    const debate = (await debateRes.json()) as { id: number };
    const stancesRes = await fetch(`${baseUrl}/conversations/${debate.id}/stances`);
    const stances = (await stancesRes.json()) as Array<{ id: number; title: string }>;
    assert(stances.length === 2, "Debate should have 2 stances");
    record("Debate", "Create debate with 2 stances", "PASS", `stances=${stances.length}`);

    // --- Join stance ---
    const joinStanceRes = await fetch(`${baseUrl}/conversations/${debate.id}/stances/${stances[0].id}/join`, {
      method: "POST",
      headers: headerA,
    });
    assert(joinStanceRes.status === 200 || joinStanceRes.status === 201, "Join stance should succeed");
    record("Debate", "Join stance", "PASS");

    // --- Create argument ---
    const argRes = await fetch(`${baseUrl}/conversations/${debate.id}/stances/${stances[0].id}/arguments`, {
      method: "POST",
      headers: headerA,
      body: JSON.stringify({ content: "Argumento de prueba para validar persistencia." }),
    });
    assert(argRes.status === 200 || argRes.status === 201, "Create argument should succeed");
    record("Debate", "Create argument", "PASS");

    // --- Cleanup debate ---
    await fetch(`${baseUrl}/conversations/${debate.id}`, { method: "DELETE", headers: headerA });
    record("Cleanup", "Delete debate", "PASS");

    // --- Private conversation + invite ---
    const privRes = await fetch(`${baseUrl}/conversations`, {
      method: "POST",
      headers: headerA,
      body: JSON.stringify({
        title: "ConversaciÃ³n privada de prueba",
        description: "DescripciÃ³n suficiente para validar conversaciÃ³n privada.",
        category: "Test",
        type: "OPEN",
        visibility: "PRIVATE",
      }),
    });
    const priv = (await privRes.json()) as { id: number };
    const inviteRes = await fetch(`${baseUrl}/conversations/${priv.id}/invites`, {
      method: "POST",
      headers: headerA,
      body: JSON.stringify({ maxUses: 1, expiresInHours: "24" }),
    });
    const invite = (await inviteRes.json()) as { token: string };
    assert(invite.token.length > 10, "Invite token should be generated");
    record("Invites", "Create invite for private conversation", "PASS");

    // --- Join private without invite (should fail) ---
    const joinPrivFail = await fetch(`${baseUrl}/conversations/${priv.id}/join`, {
      method: "POST",
      headers: headerB,
      body: JSON.stringify({}),
    });
    assert(joinPrivFail.status === 403 || joinPrivFail.status === 404, "Private join without invite should fail");
    record("Permissions", "Private conversation blocks unauthorized", "PASS");

    // --- Join private with invite ---
    const joinPrivOk = await fetch(`${baseUrl}/conversations/${priv.id}/join`, {
      method: "POST",
      headers: headerB,
      body: JSON.stringify({ inviteToken: invite.token }),
    });
    assert(joinPrivOk.status === 200 || joinPrivOk.status === 201, "Private join with valid invite should succeed");
    record("Permissions", "Private conversation accepts valid invite", "PASS");

    // --- Cleanup private ---
    await fetch(`${baseUrl}/conversations/${priv.id}`, { method: "DELETE", headers: headerA });

  } catch (error) {
    record("Fatal", "Test execution", "FAIL", (error as Error).message);
  } finally {
    await app.close();
  }

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;
  console.log(`\n=== Conversations smoke test: ${passed} passed, ${failed} failed, ${skipped} skipped ===`);
  if (failed > 0) process.exit(1);
}

run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
