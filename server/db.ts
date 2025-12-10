import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  tournaments, 
  teams, 
  players,
  tournamentPhases,
  pools,
  poolTeams,
  brackets,
  fields,
  matches,
  referees,
  tournamentAdmins,
  sponsors,
  calendarEvents,
  slideshowSlides,
  type Tournament,
  type Team,
  type Match,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Tournament queries
export async function getUserTournaments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tournaments).where(eq(tournaments.userId, userId)).orderBy(desc(tournaments.createdAt));
}

export async function getTournamentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getTournamentBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(tournaments).where(eq(tournaments.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createTournament(data: typeof tournaments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tournaments).values(data);
  return Number(result[0].insertId);
}

export async function updateTournament(id: number, data: Partial<Tournament>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(tournaments).set(data).where(eq(tournaments.id, id));
}

export async function deleteTournament(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(tournaments).where(eq(tournaments.id, id));
}

// Team queries
export async function getTournamentTeams(tournamentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(teams).where(eq(teams.tournamentId, tournamentId)).orderBy(asc(teams.name));
}

export async function createTeam(data: typeof teams.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(teams).values(data);
  return Number(result[0].insertId);
}

export async function updateTeam(id: number, data: Partial<Team>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(teams).set(data).where(eq(teams.id, id));
}

export async function deleteTeam(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(teams).where(eq(teams.id, id));
}

// Player queries
export async function getTeamPlayers(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(players).where(eq(players.teamId, teamId));
}

export async function createPlayer(data: typeof players.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(players).values(data);
  return Number(result[0].insertId);
}

export async function deletePlayer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(players).where(eq(players.id, id));
}

// Phase queries
export async function getTournamentPhases(tournamentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tournamentPhases).where(eq(tournamentPhases.tournamentId, tournamentId)).orderBy(asc(tournamentPhases.order));
}

export async function createPhase(data: typeof tournamentPhases.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tournamentPhases).values(data);
  return Number(result[0].insertId);
}

export async function deletePhase(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(tournamentPhases).where(eq(tournamentPhases.id, id));
}

// Pool queries
export async function getPhasePools(phaseId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(pools).where(eq(pools.phaseId, phaseId));
}

export async function createPool(data: typeof pools.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(pools).values(data);
  return Number(result[0].insertId);
}

export async function assignTeamToPool(poolId: number, teamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(poolTeams).values({ poolId, teamId });
}

export async function getPoolTeams(poolId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      team: teams,
      assignment: poolTeams,
    })
    .from(poolTeams)
    .innerJoin(teams, eq(poolTeams.teamId, teams.id))
    .where(eq(poolTeams.poolId, poolId));
  
  return result.map(r => r.team);
}

// Bracket queries
export async function getPhaseBrackets(phaseId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(brackets).where(eq(brackets.phaseId, phaseId));
}

export async function createBracket(data: typeof brackets.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(brackets).values(data);
  return Number(result[0].insertId);
}

// Field queries
export async function getTournamentFields(tournamentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(fields).where(eq(fields.tournamentId, tournamentId)).orderBy(asc(fields.order));
}

export async function createField(data: typeof fields.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(fields).values(data);
  return Number(result[0].insertId);
}

export async function deleteField(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(fields).where(eq(fields.id, id));
}

// Match queries
export async function getTournamentMatches(tournamentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      match: matches,
      team1: teams,
      team2: teams,
      field: fields,
    })
    .from(matches)
    .leftJoin(teams, eq(matches.team1Id, teams.id))
    .leftJoin(teams, eq(matches.team2Id, teams.id))
    .leftJoin(fields, eq(matches.fieldId, fields.id))
    .where(eq(matches.tournamentId, tournamentId))
    .orderBy(asc(matches.scheduledTime));
  
  return result;
}

export async function createMatch(data: typeof matches.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(matches).values(data);
  return Number(result[0].insertId);
}

export async function updateMatch(id: number, data: Partial<Match>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(matches).set(data).where(eq(matches.id, id));
}

export async function getPoolMatches(poolId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(matches).where(eq(matches.poolId, poolId));
}

// Calculate pool standings
export async function calculatePoolStandings(poolId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const poolMatches = await getPoolMatches(poolId);
  const teamIds = await getPoolTeams(poolId);
  
  const standings = teamIds.map(team => {
    const teamMatches = poolMatches.filter(
      m => (m.team1Id === team.id || m.team2Id === team.id) && m.status === 'completed'
    );
    
    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let points = 0;
    
    teamMatches.forEach(match => {
      if (match.score1 === null || match.score2 === null) return;
      
      played++;
      const isTeam1 = match.team1Id === team.id;
      const teamScore = isTeam1 ? match.score1 : match.score2;
      const opponentScore = isTeam1 ? match.score2 : match.score1;
      
      goalsFor += teamScore;
      goalsAgainst += opponentScore;
      
      if (teamScore > opponentScore) {
        won++;
        points += 3;
      } else if (teamScore === opponentScore) {
        drawn++;
        points += 1;
      } else {
        lost++;
      }
    });
    
    return {
      team,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points,
    };
  });
  
  // Sort by points, then goal difference, then goals for
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
  
  return standings;
}

// Referee queries
export async function getTournamentReferees(tournamentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(referees).where(eq(referees.tournamentId, tournamentId));
}

export async function createReferee(data: typeof referees.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(referees).values(data);
  return Number(result[0].insertId);
}

export async function deleteReferee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(referees).where(eq(referees.id, id));
}

// Tournament admin queries
export async function getTournamentAdmins(tournamentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      admin: tournamentAdmins,
      user: users,
    })
    .from(tournamentAdmins)
    .innerJoin(users, eq(tournamentAdmins.userId, users.id))
    .where(eq(tournamentAdmins.tournamentId, tournamentId));
  
  return result;
}

export async function addTournamentAdmin(data: typeof tournamentAdmins.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tournamentAdmins).values(data);
  return Number(result[0].insertId);
}

export async function removeTournamentAdmin(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(tournamentAdmins).where(eq(tournamentAdmins.id, id));
}

// Sponsor queries
export async function getTournamentSponsors(tournamentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(sponsors).where(eq(sponsors.tournamentId, tournamentId)).orderBy(asc(sponsors.blockNumber), asc(sponsors.order));
}

export async function createSponsor(data: typeof sponsors.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(sponsors).values(data);
  return Number(result[0].insertId);
}

export async function deleteSponsor(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(sponsors).where(eq(sponsors.id, id));
}
