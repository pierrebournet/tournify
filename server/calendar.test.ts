import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-calendar",
    email: "calendar@tournify.com",
    name: "Calendar Test User",
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

describe("Calendar System", () => {
  it("should create a field for a tournament", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const tournament = await caller.tournaments.create({
      name: "Field Test Tournament",
      sport: "Football",
      format: "pools_brackets",
    });

    const field = await caller.fields.create({
      tournamentId: tournament.id,
      name: "Terrain 1",
      order: 1,
    });

    expect(field).toHaveProperty("id");
    expect(typeof field.id).toBe("number");
  });

  it("should list fields for a tournament", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const tournament = await caller.tournaments.create({
      name: "List Fields Test",
      sport: "Football",
      format: "pools_brackets",
    });

    await caller.fields.create({
      tournamentId: tournament.id,
      name: "Terrain A",
      order: 1,
    });

    await caller.fields.create({
      tournamentId: tournament.id,
      name: "Terrain B",
      order: 2,
    });

    const fields = await caller.fields.list({ tournamentId: tournament.id });

    expect(Array.isArray(fields)).toBe(true);
    expect(fields.length).toBeGreaterThanOrEqual(2);
  });

  it("should generate matches automatically", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create tournament
    const tournament = await caller.tournaments.create({
      name: "Generate Matches Test",
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

    // Create pool
    const pool = await caller.pools.create({
      phaseId: phase.id,
      name: "Poule A",
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

    const team3 = await caller.teams.create({
      tournamentId: tournament.id,
      name: "Team 3",
    });

    // Assign teams to pool
    await caller.pools.assignTeams({
      poolId: pool.id,
      teamIds: [team1.id, team2.id, team3.id],
    });

    // Create field
    const field = await caller.fields.create({
      tournamentId: tournament.id,
      name: "Terrain 1",
      order: 1,
    });

    // Generate matches
    const startTime = new Date();
    startTime.setHours(9, 0, 0, 0);

    const result = await caller.matches.generate({
      tournamentId: tournament.id,
      poolId: pool.id,
      startTime: startTime.toISOString(),
      matchDuration: 20,
      breakDuration: 5,
      fieldIds: [field.id],
    });

    // With 3 teams, we should have 3 matches (round-robin)
    expect(result.count).toBe(3);

    // Verify matches were created
    const matches = await caller.matches.list({ tournamentId: tournament.id });
    expect(matches.length).toBe(3);
  });

  it("should create a match manually", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const tournament = await caller.tournaments.create({
      name: "Manual Match Test",
      sport: "Football",
      format: "pools_brackets",
    });

    const phase = await caller.phases.create({
      tournamentId: tournament.id,
      name: "Phase de poules",
      type: "pool",
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

    const field = await caller.fields.create({
      tournamentId: tournament.id,
      name: "Terrain 1",
      order: 1,
    });

    const scheduledTime = new Date();
    scheduledTime.setHours(10, 0, 0, 0);

    const match = await caller.matches.create({
      tournamentId: tournament.id,
      phaseId: phase.id,
      team1Id: team1.id,
      team2Id: team2.id,
      scheduledTime: scheduledTime.toISOString(),
      fieldId: field.id,
    });

    expect(match).toHaveProperty("id");
    expect(typeof match.id).toBe("number");
  });

  it("should update a match schedule", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const tournament = await caller.tournaments.create({
      name: "Update Match Test",
      sport: "Football",
      format: "pools_brackets",
    });

    const phase = await caller.phases.create({
      tournamentId: tournament.id,
      name: "Phase de poules",
      type: "pool",
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

    const field1 = await caller.fields.create({
      tournamentId: tournament.id,
      name: "Terrain 1",
      order: 1,
    });

    const field2 = await caller.fields.create({
      tournamentId: tournament.id,
      name: "Terrain 2",
      order: 2,
    });

    const scheduledTime = new Date();
    scheduledTime.setHours(10, 0, 0, 0);

    const match = await caller.matches.create({
      tournamentId: tournament.id,
      phaseId: phase.id,
      team1Id: team1.id,
      team2Id: team2.id,
      scheduledTime: scheduledTime.toISOString(),
      fieldId: field1.id,
    });

    // Update match to different field and time
    const newTime = new Date();
    newTime.setHours(14, 0, 0, 0);

    const result = await caller.matches.update({
      id: match.id,
      scheduledTime: newTime.toISOString(),
      fieldId: field2.id,
    });

    expect(result.success).toBe(true);

    // Verify the update
    const matches = await caller.matches.list({ tournamentId: tournament.id });
    const updatedMatch = matches.find(m => m.match.id === match.id);
    
    expect(updatedMatch).toBeDefined();
    expect(updatedMatch?.field?.id).toBe(field2.id);
  });
});
