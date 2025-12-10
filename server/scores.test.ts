import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-scores",
    email: "scores@tournify.com",
    name: "Scores Test User",
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

describe("Scores System", () => {
  it("should submit a score for a match", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create tournament
    const tournament = await caller.tournaments.create({
      name: "Score Test Tournament",
      sport: "Football",
      format: "pools_brackets",
    });

    // Create phase
    const phase = await caller.phases.create({
      tournamentId: tournament.id,
      name: "Phase de poules",
      type: "pool",
      order: 1,
    });

    // Create field
    const field = await caller.fields.create({
      tournamentId: tournament.id,
      name: "Field 1",
      order: 1,
    });

    // Create teams
    const team1 = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team A",
    });

    const team2 = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team B",
    });

    // Create match
    const scheduledTime = new Date();
    scheduledTime.setHours(10, 0, 0, 0);

    const match = await caller.matches.create({
      tournamentId: tournament.id,
      phaseId: phase.id,
      team1Id: team1.id,
      team2Id: team2.id,
      fieldId: field.id,
      scheduledTime: scheduledTime.toISOString(),
    });

    // Submit score
    const result = await caller.matches.submitScore({
      matchId: match.id,
      score1: 3,
      score2: 1,
    });

    expect(result.success).toBe(true);

    // Verify the score was saved
    const matches = await caller.matches.list({ tournamentId: tournament.id });
    const updatedMatch = matches.find(m => m.match.id === match.id);

    expect(updatedMatch).toBeDefined();
    expect(updatedMatch?.match.score1).toBe(3);
    expect(updatedMatch?.match.score2).toBe(1);
    expect(updatedMatch?.match.status).toBe("completed");
  });

  it("should validate score range (0-99)", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const tournament = await caller.tournaments.create({
      name: "Validation Test",
      sport: "Football",
      format: "pools_brackets",
    });

    const phase = await caller.phases.create({
      tournamentId: tournament.id,
      name: "Phase de poules",
      type: "pool",
      order: 1,
    });

    const field = await caller.fields.create({
      tournamentId: tournament.id,
      name: "Field 1",
      order: 1,
    });

    const team1 = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team X",
    });

    const team2 = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team Y",
    });

    const match = await caller.matches.create({
      tournamentId: tournament.id,
      phaseId: phase.id,
      team1Id: team1.id,
      team2Id: team2.id,
      fieldId: field.id,
      scheduledTime: new Date().toISOString(),
    });

    // Test invalid score (> 99)
    await expect(
      caller.matches.submitScore({
        matchId: match.id,
        score1: 100,
        score2: 50,
      })
    ).rejects.toThrow();

    // Test valid score
    const result = await caller.matches.submitScore({
      matchId: match.id,
      score1: 5,
      score2: 3,
    });

    expect(result.success).toBe(true);
  });

  it("should update standings after score submission", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create tournament
    const tournament = await caller.tournaments.create({
      name: "Standings Update Test",
      sport: "Football",
      format: "pools_brackets",
    });

    // Create phase and pool
    const phase = await caller.phases.create({
      tournamentId: tournament.id,
      name: "Phase de poules",
      type: "pool",
      order: 1,
    });

    const pool = await caller.pools.create({
      phaseId: phase.id,
      name: "Poule A",
    });

    const field = await caller.fields.create({
      tournamentId: tournament.id,
      name: "Field 1",
      order: 1,
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

    // Assign teams to pool
    await caller.pools.assignTeams({
      poolId: pool.id,
      teamIds: [team1.id, team2.id],
    });

    // Create match
    const match = await caller.matches.create({
      tournamentId: tournament.id,
      phaseId: phase.id,
      poolId: pool.id,
      team1Id: team1.id,
      team2Id: team2.id,
      fieldId: field.id,
      scheduledTime: new Date().toISOString(),
    });

    // Submit score (team1 wins 3-1)
    await caller.matches.submitScore({
      matchId: match.id,
      score1: 3,
      score2: 1,
    });

    // Get standings
    const standings = await caller.pools.getStandings({ poolId: pool.id });

    // Team 1 should have 3 points (win)
    const team1Standing = standings.find(s => s.team.id === team1.id);
    expect(team1Standing).toBeDefined();
    expect(team1Standing?.points).toBe(3);
    expect(team1Standing?.won).toBe(1);
    expect(team1Standing?.goalsFor).toBe(3);
    expect(team1Standing?.goalsAgainst).toBe(1);
    expect(team1Standing?.goalDifference).toBe(2);

    // Team 2 should have 0 points (loss)
    const team2Standing = standings.find(s => s.team.id === team2.id);
    expect(team2Standing).toBeDefined();
    expect(team2Standing?.points).toBe(0);
    expect(team2Standing?.lost).toBe(1);
    expect(team2Standing?.goalsFor).toBe(1);
    expect(team2Standing?.goalsAgainst).toBe(3);
    expect(team2Standing?.goalDifference).toBe(-2);
  });

  it("should handle draw scores correctly", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const tournament = await caller.tournaments.create({
      name: "Draw Test",
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
    });

    const field = await caller.fields.create({
      tournamentId: tournament.id,
      name: "Field 1",
      order: 1,
    });

    const team1 = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team A",
    });

    const team2 = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team B",
    });

    await caller.pools.assignTeams({
      poolId: pool.id,
      teamIds: [team1.id, team2.id],
    });

    const match = await caller.matches.create({
      tournamentId: tournament.id,
      phaseId: phase.id,
      poolId: pool.id,
      team1Id: team1.id,
      team2Id: team2.id,
      fieldId: field.id,
      scheduledTime: new Date().toISOString(),
    });

    // Submit draw score (2-2)
    await caller.matches.submitScore({
      matchId: match.id,
      score1: 2,
      score2: 2,
    });

    const standings = await caller.pools.getStandings({ poolId: pool.id });

    // Both teams should have 1 point (draw)
    const team1Standing = standings.find(s => s.team.id === team1.id);
    expect(team1Standing?.points).toBe(1);
    expect(team1Standing?.drawn).toBe(1);

    const team2Standing = standings.find(s => s.team.id === team2.id);
    expect(team2Standing?.points).toBe(1);
    expect(team2Standing?.drawn).toBe(1);
  });
});
