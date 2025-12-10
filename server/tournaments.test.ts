import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@tournify.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Tournaments", () => {
  it("should create a tournament with valid data", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tournaments.create({
      name: "Test Tournament",
      sport: "Football",
      format: "pools_brackets",
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("slug");
    expect(result).toHaveProperty("publicUrl");
    expect(result.slug).toContain("test-tournament");
  });

  it("should list tournaments for authenticated user", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const tournaments = await caller.tournaments.list();

    expect(Array.isArray(tournaments)).toBe(true);
  });

  it("should update tournament settings", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a tournament first
    const created = await caller.tournaments.create({
      name: "Update Test",
      sport: "Basketball",
      format: "pools_only",
    });

    // Update it
    const result = await caller.tournaments.update({
      id: created.id,
      name: "Updated Tournament",
      primaryColor: "#FF0000",
      isPublic: true,
    });

    expect(result.success).toBe(true);

    // Verify the update
    const updated = await caller.tournaments.getById({ id: created.id });
    expect(updated?.name).toBe("Updated Tournament");
    expect(updated?.primaryColor).toBe("#FF0000");
    expect(updated?.isPublic).toBe(true);
  });
});

describe("Teams", () => {
  it("should create a team for a tournament", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a tournament first
    const tournament = await caller.tournaments.create({
      name: "Team Test Tournament",
      sport: "Football",
      format: "pools_brackets",
    });

    // Create a team
    const result = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Test Team",
      email: "team@test.com",
      country: "France",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list teams for a tournament", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a tournament
    const tournament = await caller.tournaments.create({
      name: "List Teams Test",
      sport: "Football",
      format: "pools_brackets",
    });

    // Create some teams
    await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team A",
    });
    await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team B",
    });

    // List teams
    const teams = await caller.teams.list({ tournamentId: tournament.id });

    expect(Array.isArray(teams)).toBe(true);
    expect(teams.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Authentication", () => {
  it("should return current user info", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.email).toBe("test@tournify.com");
    expect(user?.name).toBe("Test User");
  });
});
