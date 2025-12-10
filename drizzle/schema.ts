import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, unique } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Tournaments table - Main tournament configuration
 */
export const tournaments = mysqlTable("tournaments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the tournament
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // For public URL
  sport: varchar("sport", { length: 100 }), // Football, Basketball, etc.
  gender: mysqlEnum("gender", ["male", "female", "mixed"]),
  level: int("level"), // 1-3 stars
  ageMin: int("ageMin"),
  ageMax: int("ageMax"),
  country: varchar("country", { length: 100 }),
  isEsport: boolean("isEsport").default(false),
  format: mysqlEnum("format", ["pools_brackets", "pools_only", "brackets_only", "plateau", "friendly"]).notNull(),
  
  // Dates and locations
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  dates: json("dates").$type<string[]>(), // Multiple match days
  locations: json("locations").$type<{ address: string; name?: string }[]>(),
  
  // Customization
  primaryColor: varchar("primaryColor", { length: 7 }).default("#FF7B00"), // HEX color
  logoUrl: text("logoUrl"),
  backgroundUrl: text("backgroundUrl"),
  
  // Scoring rules
  pointsWin: int("pointsWin").default(3),
  pointsDraw: int("pointsDraw").default(1),
  pointsLoss: int("pointsLoss").default(0),
  
  // Public settings
  isPublic: boolean("isPublic").default(false),
  showInApp: boolean("showInApp").default(false),
  publicUrl: text("publicUrl"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Tournament phases - Supports multiple phases (pools, brackets, friendly matches)
 */
export const tournamentPhases = mysqlTable("tournamentPhases", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["pool", "bracket", "friendly"]).notNull(),
  order: int("order").notNull(), // Phase order (1, 2, 3...)
  emoji: varchar("emoji", { length: 10 }), // For pools
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Teams table
 */
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logoUrl"),
  email: varchar("email", { length: 320 }),
  country: varchar("country", { length: 100 }),
  locker: varchar("locker", { length: 50 }), // Vestiaire
  isPaid: boolean("isPaid").default(false),
  isPresent: boolean("isPresent").default(false),
  isExempt: boolean("isExempt").default(false), // Virtual team for balancing pools
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Players table (for team sports)
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  birthDate: timestamp("birthDate"),
  number: int("number"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Pools - Groups within a phase
 */
export const pools = mysqlTable("pools", {
  id: int("id").autoincrement().primaryKey(),
  phaseId: int("phaseId").notNull(),
  name: varchar("name", { length: 50 }).notNull(), // A, B, C, D...
  emoji: varchar("emoji", { length: 10 }), // 🩸, 🕷️, 💀, 🦇
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Pool teams - Assignment of teams to pools
 */
export const poolTeams = mysqlTable("poolTeams", {
  id: int("id").autoincrement().primaryKey(),
  poolId: int("poolId").notNull(),
  teamId: int("teamId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  // Ensure a team can only be in one pool at a time
  uniquePoolTeam: unique().on(table.poolId, table.teamId),
}));

/**
 * Brackets - Elimination rounds
 */
export const brackets = mysqlTable("brackets", {
  id: int("id").autoincrement().primaryKey(),
  phaseId: int("phaseId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // E, K, F, J, G, I...
  round: mysqlEnum("round", ["quarters", "semis", "final", "third_place"]),
  qualificationRule: json("qualificationRule").$type<{ poolRank: number; poolId?: number }[]>(), // Which teams qualify
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Fields/Terrains
 */
export const fields = mysqlTable("fields", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Matches table
 */
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  phaseId: int("phaseId").notNull(),
  poolId: int("poolId"), // Null for bracket/friendly matches
  bracketId: int("bracketId"), // Null for pool/friendly matches
  
  team1Id: int("team1Id"),
  team2Id: int("team2Id"),
  
  score1: int("score1"),
  score2: int("score2"),
  
  scheduledTime: timestamp("scheduledTime"),
  fieldId: int("fieldId"),
  
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  matchNumber: varchar("matchNumber", { length: 20 }), // E1, E2, K1, etc.
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Calendar events (pauses, ceremonies, etc.)
 */
export const calendarEvents = mysqlTable("calendarEvents", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  fieldId: int("fieldId"),
  type: mysqlEnum("type", ["pause", "ceremony", "other"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  scheduledTime: timestamp("scheduledTime").notNull(),
  duration: int("duration"), // In minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Referees
 */
export const referees = mysqlTable("referees", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Tournament administrators (co-organizers)
 */
export const tournamentAdmins = mysqlTable("tournamentAdmins", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  userId: int("userId").notNull(),
  permissions: json("permissions").$type<string[]>(), // ["edit_teams", "edit_scores", etc.]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Sponsors
 */
export const sponsors = mysqlTable("sponsors", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logoUrl").notNull(),
  blockNumber: int("blockNumber").default(1), // Multiple sponsor blocks
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Slideshow configuration
 */
export const slideshowSlides = mysqlTable("slideshowSlides", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  type: mysqlEnum("type", ["standings", "calendar", "scores", "custom"]).notNull(),
  content: json("content").$type<any>(),
  duration: int("duration").default(10), // Seconds
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Relations
export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  owner: one(users, {
    fields: [tournaments.userId],
    references: [users.id],
  }),
  phases: many(tournamentPhases),
  teams: many(teams),
  fields: many(fields),
  matches: many(matches),
  referees: many(referees),
  admins: many(tournamentAdmins),
  sponsors: many(sponsors),
}));

export const tournamentPhasesRelations = relations(tournamentPhases, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [tournamentPhases.tournamentId],
    references: [tournaments.id],
  }),
  pools: many(pools),
  brackets: many(brackets),
  matches: many(matches),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [teams.tournamentId],
    references: [tournaments.id],
  }),
  players: many(players),
  poolAssignments: many(poolTeams),
}));

export const poolsRelations = relations(pools, ({ one, many }) => ({
  phase: one(tournamentPhases, {
    fields: [pools.phaseId],
    references: [tournamentPhases.id],
  }),
  teamAssignments: many(poolTeams),
  matches: many(matches),
}));

export const poolTeamsRelations = relations(poolTeams, ({ one }) => ({
  pool: one(pools, {
    fields: [poolTeams.poolId],
    references: [pools.id],
  }),
  team: one(teams, {
    fields: [poolTeams.teamId],
    references: [teams.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [matches.tournamentId],
    references: [tournaments.id],
  }),
  phase: one(tournamentPhases, {
    fields: [matches.phaseId],
    references: [tournamentPhases.id],
  }),
  pool: one(pools, {
    fields: [matches.poolId],
    references: [pools.id],
  }),
  bracket: one(brackets, {
    fields: [matches.bracketId],
    references: [brackets.id],
  }),
  team1: one(teams, {
    fields: [matches.team1Id],
    references: [teams.id],
  }),
  team2: one(teams, {
    fields: [matches.team2Id],
    references: [teams.id],
  }),
  field: one(fields, {
    fields: [matches.fieldId],
    references: [fields.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = typeof tournaments.$inferInsert;
export type TournamentPhase = typeof tournamentPhases.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Pool = typeof pools.$inferSelect;
export type PoolTeam = typeof poolTeams.$inferSelect;
export type Bracket = typeof brackets.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Field = typeof fields.$inferSelect;
export type Referee = typeof referees.$inferSelect;
export type TournamentAdmin = typeof tournamentAdmins.$inferSelect;
export type Sponsor = typeof sponsors.$inferSelect;
