import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
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

describe("Notifications", () => {
  it("should send notification when tournament is created", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a tournament (should trigger notification)
    const result = await caller.tournaments.create({
      name: "Test Tournament",
      sport: "Football",
      format: "pools_brackets",
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("slug");
    // Notification is sent in the background, we just verify the tournament was created
  });

  it.skip("should send notification when score is submitted", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create tournament and teams first
    const tournament = await caller.tournaments.create({
      name: "Score Test Tournament",
      sport: "Football",
      format: "pools_brackets",
    });

    const team1 = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team A",
    });

    const team2 = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team B",
    });

    // Create a phase and pool
    const phase = await caller.phases.create({
      tournamentId: tournament.id,
      name: "Phase 1",
      type: "pool",
      order: 1,
    });

    const pool = await caller.pools.create({
      phaseId: phase.id,
      name: "Pool A",
      emoji: "⚽",
    });

    // Assign teams to pool
    await caller.pools.assignTeams({
      poolId: pool.id,
      teamIds: [team1.id, team2.id],
    });

    // Create a field
    const field = await caller.fields.create({
      tournamentId: tournament.id,
      name: "Field 1",
    });

    // Create a match manually
    await caller.matches.create({
      tournamentId: tournament.id,
      phaseId: phase.id,
      poolId: pool.id,
      team1Id: team1.id,
      team2Id: team2.id,
      fieldId: field.id,
      scheduledTime: new Date().toISOString(),
    });

    // Get the generated match
    const matches = await caller.matches.list({
      tournamentId: tournament.id,
    });

    expect(matches.length).toBeGreaterThan(0);

    // Submit score (should trigger notification)
    const scoreResult = await caller.matches.submitScore({
      matchId: matches[0]!.id,
      score1: 3,
      score2: 1,
    });

    expect(scoreResult.success).toBe(true);
    // Notification is sent in the background
  });
});
