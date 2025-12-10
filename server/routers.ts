import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";
import * as db from "./db";

// Helper to generate URL-safe slug
function generateSlug(name: string): string {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${nanoid(8)}`;
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  tournaments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserTournaments(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTournamentById(input.id);
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await db.getTournamentBySlug(input.slug);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          sport: z.string().optional(),
          format: z.enum(["pools_brackets", "pools_only", "brackets_only", "plateau", "friendly"]),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const slug = generateSlug(input.name);
        const publicUrl = `/live/${slug}`;

        const tournamentId = await db.createTournament({
          userId: ctx.user.id,
          name: input.name,
          slug,
          sport: input.sport,
          format: input.format,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          publicUrl,
        });

        // Send notification
        await notifyOwner({
          title: "Nouveau tournoi créé 🏆",
          content: `Le tournoi "${input.name}" a été créé avec succès. Vous pouvez maintenant ajouter des équipes et configurer le calendrier.`,
        });

        return { id: tournamentId, slug, publicUrl };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          sport: z.string().optional(),
          gender: z.enum(["male", "female", "mixed"]).optional(),
          level: z.number().min(1).max(3).optional(),
          ageMin: z.number().optional(),
          ageMax: z.number().optional(),
          country: z.string().optional(),
          isEsport: z.boolean().optional(),
          primaryColor: z.string().optional(),
          pointsWin: z.number().optional(),
          pointsDraw: z.number().optional(),
          pointsLoss: z.number().optional(),
          dates: z.array(z.string()).optional(),
          locations: z.array(z.object({ address: z.string(), name: z.string().optional() })).optional(),
          isPublic: z.boolean().optional(),
          showInApp: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTournament(id, data as any);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTournament(input.id);
        return { success: true };
      }),

    uploadLogo: protectedProcedure
      .input(
        z.object({
          tournamentId: z.number(),
          fileData: z.string(), // base64
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const fileKey = `tournaments/${input.tournamentId}/logo-${nanoid()}.png`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        await db.updateTournament(input.tournamentId, { logoUrl: url });
        return { url };
      }),

    uploadBackground: protectedProcedure
      .input(
        z.object({
          tournamentId: z.number(),
          fileData: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const fileKey = `tournaments/${input.tournamentId}/bg-${nanoid()}.jpg`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        await db.updateTournament(input.tournamentId, { backgroundUrl: url });
        return { url };
      }),
  }),

  teams: router({
    list: protectedProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTournamentTeams(input.tournamentId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          tournamentId: z.number(),
          name: z.string().min(1),
          email: z.string().email().optional(),
          country: z.string().optional(),
          locker: z.string().optional(),
          isPaid: z.boolean().optional(),
          isPresent: z.boolean().optional(),
          isExempt: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const teamId = await db.createTeam(input);
        return { id: teamId };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          email: z.string().optional(),
          country: z.string().optional(),
          locker: z.string().optional(),
          isPaid: z.boolean().optional(),
          isPresent: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTeam(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTeam(input.id);
        return { success: true };
      }),

    uploadLogo: protectedProcedure
      .input(
        z.object({
          teamId: z.number(),
          fileData: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const fileKey = `teams/${input.teamId}/logo-${nanoid()}.png`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        await db.updateTeam(input.teamId, { logoUrl: url });
        return { url };
      }),
  }),

  players: router({
    list: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTeamPlayers(input.teamId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          teamId: z.number(),
          name: z.string().min(1),
          birthDate: z.string().optional(),
          number: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const playerId = await db.createPlayer({
          ...input,
          birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
        });
        return { id: playerId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePlayer(input.id);
        return { success: true };
      }),
  }),

  phases: router({
    list: protectedProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTournamentPhases(input.tournamentId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          tournamentId: z.number(),
          name: z.string().min(1),
          type: z.enum(["pool", "bracket", "friendly"]),
          order: z.number(),
          emoji: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const phaseId = await db.createPhase(input);
        return { id: phaseId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePhase(input.id);
        return { success: true };
      }),
  }),

  pools: router({
    list: protectedProcedure
      .input(z.object({ phaseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPhasePools(input.phaseId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          phaseId: z.number(),
          name: z.string().min(1),
          emoji: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const poolId = await db.createPool(input);
        return { id: poolId };
      }),

    assignTeams: protectedProcedure
      .input(
        z.object({
          poolId: z.number(),
          teamIds: z.array(z.number()),
        })
      )
      .mutation(async ({ input }) => {
        for (const teamId of input.teamIds) {
          await db.assignTeamToPool(input.poolId, teamId);
        }
        return { success: true };
      }),

    getTeams: protectedProcedure
      .input(z.object({ poolId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPoolTeams(input.poolId);
      }),

    getStandings: protectedProcedure
      .input(z.object({ poolId: z.number() }))
      .query(async ({ input }) => {
        return await db.calculatePoolStandings(input.poolId);
      }),
  }),

  brackets: router({
    list: protectedProcedure
      .input(z.object({ phaseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPhaseBrackets(input.phaseId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          phaseId: z.number(),
          name: z.string().min(1),
          round: z.enum(["quarters", "semis", "final", "third_place"]).optional(),
          qualificationRule: z
            .array(z.object({ poolRank: z.number(), poolId: z.number().optional() }))
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const bracketId = await db.createBracket(input as any);
        return { id: bracketId };
      }),
  }),

  fields: router({
    list: protectedProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTournamentFields(input.tournamentId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          tournamentId: z.number(),
          name: z.string().min(1),
          order: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const fieldId = await db.createField(input);
        return { id: fieldId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteField(input.id);
        return { success: true };
      }),
  }),

  matches: router({
    list: protectedProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTournamentMatches(input.tournamentId);
      }),

    generate: protectedProcedure
      .input(
        z.object({
          tournamentId: z.number(),
          poolId: z.number().optional(),
          startTime: z.string(),
          matchDuration: z.number(),
          breakDuration: z.number(),
          fieldIds: z.array(z.number()),
        })
      )
      .mutation(async ({ input }) => {
        const generated = await db.generatePoolMatches({
          ...input,
          startTime: new Date(input.startTime),
        });
        return { count: generated };
      }),

    create: protectedProcedure
      .input(
        z.object({
          tournamentId: z.number(),
          phaseId: z.number(),
          poolId: z.number().optional(),
          bracketId: z.number().optional(),
          team1Id: z.number().optional(),
          team2Id: z.number().optional(),
          scheduledTime: z.string().optional(),
          fieldId: z.number().optional(),
          matchNumber: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const matchId = await db.createMatch({
          ...input,
          scheduledTime: input.scheduledTime ? new Date(input.scheduledTime) : undefined,
        } as any);
        return { id: matchId };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          team1Id: z.number().optional(),
          team2Id: z.number().optional(),
          score1: z.number().optional(),
          score2: z.number().optional(),
          scheduledTime: z.string().optional(),
          fieldId: z.number().optional(),
          status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, scheduledTime, ...data } = input;
        await db.updateMatch(id, {
          ...data,
          scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
        } as any);
        return { success: true };
      }),

    submitScore: protectedProcedure
      .input(
        z.object({
          matchId: z.number(),
          score1: z.number().min(0).max(99),
          score2: z.number().min(0).max(99),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateMatch(input.matchId, {
          score1: input.score1,
          score2: input.score2,
          status: "completed",
        });

        // Send notification
        await notifyOwner({
          title: "Nouveau score enregistré ⚽",
          content: `Un score a été enregistré : ${input.score1} - ${input.score2}`,
        });

        return { success: true };
      }),
  }),

  referees: router({
    list: protectedProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTournamentReferees(input.tournamentId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          tournamentId: z.number(),
          name: z.string().min(1),
          email: z.string().email().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const refereeId = await db.createReferee(input);
        return { id: refereeId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteReferee(input.id);
        return { success: true };
      }),
  }),

  admins: router({
    list: protectedProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTournamentAdmins(input.tournamentId);
      }),

    add: protectedProcedure
      .input(
        z.object({
          tournamentId: z.number(),
          userId: z.number(),
          permissions: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const adminId = await db.addTournamentAdmin(input);
        return { id: adminId };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeTournamentAdmin(input.id);
        return { success: true };
      }),
  }),

  sponsors: router({
    list: protectedProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTournamentSponsors(input.tournamentId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          tournamentId: z.number(),
          name: z.string().min(1),
          fileData: z.string(),
          mimeType: z.string(),
          blockNumber: z.number().optional(),
          order: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const fileKey = `sponsors/${input.tournamentId}/${nanoid()}.png`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        const sponsorId = await db.createSponsor({
          tournamentId: input.tournamentId,
          name: input.name,
          logoUrl: url,
          blockNumber: input.blockNumber || 1,
          order: input.order,
        });
        return { id: sponsorId, url };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSponsor(input.id);
        return { success: true };
      }),
  }),

  notifications: router({
    // Notify owner when a new tournament is created
    notifyTournamentCreated: protectedProcedure
      .input(z.object({ tournamentName: z.string() }))
      .mutation(async ({ input }) => {
        const success = await notifyOwner({
          title: "Nouveau tournoi créé",
          content: `Le tournoi "${input.tournamentName}" a été créé avec succès.`,
        });
        return { success };
      }),

    // Notify owner when a team is added
    notifyTeamAdded: protectedProcedure
      .input(z.object({ tournamentName: z.string(), teamName: z.string() }))
      .mutation(async ({ input }) => {
        const success = await notifyOwner({
          title: "Nouvelle équipe ajoutée",
          content: `L'équipe "${input.teamName}" a été ajoutée au tournoi "${input.tournamentName}".`,
        });
        return { success };
      }),

    // Notify owner when a match schedule is updated
    notifyScheduleUpdated: protectedProcedure
      .input(z.object({ tournamentName: z.string(), matchCount: z.number() }))
      .mutation(async ({ input }) => {
        const success = await notifyOwner({
          title: "Calendrier mis à jour",
          content: `Le calendrier du tournoi "${input.tournamentName}" a été mis à jour (${input.matchCount} matchs).`,
        });
        return { success };
      }),

    // Notify owner when a score is submitted
    notifyScoreSubmitted: protectedProcedure
      .input(
        z.object({
          tournamentName: z.string(),
          team1Name: z.string(),
          team2Name: z.string(),
          score1: z.number(),
          score2: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const success = await notifyOwner({
          title: "Nouveau score enregistré",
          content: `${input.team1Name} ${input.score1} - ${input.score2} ${input.team2Name} dans le tournoi "${input.tournamentName}".`,
        });
        return { success };
      }),
  }),
});

export type AppRouter = typeof appRouter;
