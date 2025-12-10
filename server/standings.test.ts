import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-standings",
    email: "standings@tournify.com",
    name: "Standings Test User",
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

describe("Standings System", () => {
  it("should create a phase for a tournament", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a tournament
    const tournament = await caller.tournaments.create({
      name: "Phase Test Tournament",
      sport: "Football",
      format: "pools_brackets",
    });

    // Create a phase
    const phase = await caller.phases.create({
      tournamentId: tournament.id,
      name: "Phase de poules",
      type: "pool",
      order: 1,
      emoji: "⚽",
    });

    expect(phase).toHaveProperty("id");
    expect(typeof phase.id).toBe("number");
  });

  it("should create a pool in a phase", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create tournament and phase
    const tournament = await caller.tournaments.create({
      name: "Pool Test Tournament",
      sport: "Football",
      format: "pools_brackets",
    });

    const phase = await caller.phases.create({
      tournamentId: tournament.id,
      name: "Phase de poules",
      type: "pool",
      order: 1,
    });

    // Create a pool
    const pool = await caller.pools.create({
      phaseId: phase.id,
      name: "Poule A",
      emoji: "⚽",
    });

    expect(pool).toHaveProperty("id");
    expect(typeof pool.id).toBe("number");
  });

  it("should list pools for a phase", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create tournament and phase
    const tournament = await caller.tournaments.create({
      name: "List Pools Test",
      sport: "Football",
      format: "pools_brackets",
    });

    const phase = await caller.phases.create({
      tournamentId: tournament.id,
      name: "Phase de poules",
      type: "pool",
      order: 1,
    });

    // Create multiple pools
    await caller.pools.create({
      phaseId: phase.id,
      name: "Poule A",
      emoji: "⚽",
    });

    await caller.pools.create({
      phaseId: phase.id,
      name: "Poule B",
      emoji: "🏀",
    });

    // List pools
    const pools = await caller.pools.list({ phaseId: phase.id });

    expect(Array.isArray(pools)).toBe(true);
    expect(pools.length).toBeGreaterThanOrEqual(2);
  });

  it("should assign teams to a pool", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create tournament, phase, and pool
    const tournament = await caller.tournaments.create({
      name: "Assign Teams Test",
      sport: "Football",
      format: "pools_brackets",
    });

    const phase = await caller.phases.create({
      tournamentId: tournament.id,
      name: "Phase de poules",
      type: "pool",
      order: 1,
    });

    const pool = await caller.pools.create({
      phaseId: phase.id,
      name: "Poule A",
      emoji: "⚽",
    });

    // Create teams
    const team1 = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team Alpha",
    });

    const team2 = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team Beta",
    });

    // Assign teams to pool
    const result = await caller.pools.assignTeams({
      poolId: pool.id,
      teamIds: [team1.id, team2.id],
    });

    expect(result.success).toBe(true);

    // Verify teams are assigned
    const poolTeams = await caller.pools.getTeams({ poolId: pool.id });
    expect(poolTeams.length).toBe(2);
  });

  it("should calculate pool standings", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create tournament, phase, and pool
    const tournament = await caller.tournaments.create({
      name: "Standings Calculation Test",
      sport: "Football",
      format: "pools_brackets",
    });

    const phase = await caller.phases.create({
      tournamentId: tournament.id,
      name: "Phase de poules",
      type: "pool",
      order: 1,
    });

    const pool = await caller.pools.create({
      phaseId: phase.id,
      name: "Poule A",
      emoji: "⚽",
    });

    // Create teams
    const team1 = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team 1",
    });

    const team2 = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team 2",
    });

    // Assign teams
    await caller.pools.assignTeams({
      poolId: pool.id,
      teamIds: [team1.id, team2.id],
    });

    // Get standings (should be empty initially)
    const standings = await caller.pools.getStandings({ poolId: pool.id });

    expect(Array.isArray(standings)).toBe(true);
    expect(standings.length).toBe(2);
    
    // Verify initial standings structure
    standings.forEach(standing => {
      expect(standing).toHaveProperty("team");
      expect(standing).toHaveProperty("played");
      expect(standing).toHaveProperty("won");
      expect(standing).toHaveProperty("drawn");
      expect(standing).toHaveProperty("lost");
      expect(standing).toHaveProperty("goalsFor");
      expect(standing).toHaveProperty("goalsAgainst");
      expect(standing).toHaveProperty("goalDifference");
      expect(standing).toHaveProperty("points");
    });
  });

  it("should create a bracket in a phase", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create tournament and phase
    const tournament = await caller.tournaments.create({
      name: "Bracket Test Tournament",
      sport: "Football",
      format: "pools_brackets",
    });

    const phase = await caller.phases.create({
      tournamentId: tournament.id,
      name: "Phase finale",
      type: "bracket",
      order: 2,
    });

    // Create a bracket
    const bracket = await caller.brackets.create({
      phaseId: phase.id,
      name: "Ligue des Champions",
      round: "quarters",
    });

    expect(bracket).toHaveProperty("id");
    expect(typeof bracket.id).toBe("number");
  });
});
