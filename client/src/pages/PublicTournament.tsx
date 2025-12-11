import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, MapPin, Trophy, Users, Share2, QrCode, Copy, CheckCircle2 } from "lucide-react";
import { useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function PublicTournament() {
  const params = useParams();
  const tournamentId = parseInt(params.id || "0");
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: tournament, isLoading: tournamentLoading } = trpc.tournaments.getById.useQuery({ id: tournamentId });
  const { data: phases } = trpc.phases.list.useQuery({ tournamentId });
  const { data: matches } = trpc.matches.list.useQuery({ tournamentId });
  const { data: sponsors } = trpc.sponsors.list.useQuery({ tournamentId });

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (tournamentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du tournoi...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Tournoi introuvable</CardTitle>
            <CardDescription>
              Ce tournoi n'existe pas ou n'est pas accessible publiquement.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const primaryColor = tournament.primaryColor || "#f97316";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header with tournament info */}
      <div 
        className="relative bg-gradient-to-r from-orange-500 to-red-500 text-white py-16 px-4"
        style={{
          background: tournament.backgroundUrl 
            ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${tournament.backgroundUrl}) center/cover`
            : `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)`,
        }}
      >
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-6 mb-6">
            {tournament.logoUrl && (
              <img
                src={tournament.logoUrl}
                alt={tournament.name}
                className="h-24 w-24 object-contain bg-white rounded-lg p-2"
              />
            )}
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{tournament.name}</h1>
              <div className="flex flex-wrap gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  <span>{tournament.sport}</span>
                </div>
                {tournament.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>
                      {format(new Date(tournament.startDate), "dd MMM yyyy", { locale: fr })}
                      {tournament.endDate && ` - ${format(new Date(tournament.endDate), "dd MMM", { locale: fr })}`}
                    </span>
                  </div>
                )}
                {tournament.locations && tournament.locations.length > 0 && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{tournament.locations.map(loc => loc.name || loc.address).join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2"
            >
              {copiedLink ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedLink ? "Copié !" : "Copier le lien"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Partager
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <Tabs defaultValue="standings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="standings">Classements</TabsTrigger>
            <TabsTrigger value="calendar">Calendrier</TabsTrigger>
            <TabsTrigger value="results">Résultats</TabsTrigger>
          </TabsList>

          <TabsContent value="standings" className="space-y-6">
            {phases?.filter(p => p.type === "pool").map(phase => (
              <PhaseStandings key={phase.id} phase={phase} />
            ))}
            {(!phases || phases.filter(p => p.type === "pool").length === 0) && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Les classements seront disponibles une fois les poules créées</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            {matches && matches.length > 0 ? (
              matches.map((match) => (
                <MatchCard key={match.match.id} match={match} primaryColor={primaryColor} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Le calendrier sera disponible une fois les matchs générés</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {matches && matches.filter(m => m.match.status === "completed").length > 0 ? (
              matches
                .filter(m => m.match.status === "completed")
                .map((match) => (
                  <MatchCard key={match.match.id} match={match} primaryColor={primaryColor} showScore />
                ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Les résultats seront disponibles une fois les matchs terminés</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Sponsors section */}
        {sponsors && sponsors.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-center">Nos partenaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-center items-center gap-8">
                {sponsors.map((sponsor) => (
                  <img
                    key={sponsor.id}
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    className="h-16 object-contain grayscale hover:grayscale-0 transition-all"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface PhaseStandingsProps {
  phase: {
    id: number;
    name: string;
    type: string;
  };
}

function PhaseStandings({ phase }: PhaseStandingsProps) {
  const { data: pools } = trpc.pools.list.useQuery({ phaseId: phase.id });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{phase.name}</h2>
      {pools?.map(pool => (
        <PoolStandings key={pool.id} pool={pool} />
      ))}
    </div>
  );
}

interface PoolStandingsProps {
  pool: {
    id: number;
    name: string;
    emoji?: string | null;
  };
}

function PoolStandings({ pool }: PoolStandingsProps) {
  const { data: standings } = trpc.pools.getStandings.useQuery({ poolId: pool.id });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {pool.emoji && <span className="text-2xl">{pool.emoji}</span>}
          {pool.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {standings && standings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Équipe</TableHead>
                <TableHead className="text-center">J</TableHead>
                <TableHead className="text-center">V</TableHead>
                <TableHead className="text-center">N</TableHead>
                <TableHead className="text-center">D</TableHead>
                <TableHead className="text-center">BP</TableHead>
                <TableHead className="text-center">BC</TableHead>
                <TableHead className="text-center">Diff</TableHead>
                <TableHead className="text-center font-bold">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((standing, index) => (
                <TableRow key={standing.team.id} className={index < 2 ? "bg-green-50" : ""}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {standing.team.logoUrl && (
                      <img
                        src={standing.team.logoUrl}
                        alt={standing.team.name}
                        className="h-6 w-6 object-contain"
                      />
                    )}
                    <span className="font-medium">{standing.team.name}</span>
                  </TableCell>
                  <TableCell className="text-center">{standing.played}</TableCell>
                  <TableCell className="text-center">{standing.won}</TableCell>
                  <TableCell className="text-center">{standing.drawn}</TableCell>
                  <TableCell className="text-center">{standing.lost}</TableCell>
                  <TableCell className="text-center">{standing.goalsFor}</TableCell>
                  <TableCell className="text-center">{standing.goalsAgainst}</TableCell>
                  <TableCell className="text-center">
                    {standing.goalDifference > 0 ? "+" : ""}
                    {standing.goalDifference}
                  </TableCell>
                  <TableCell className="text-center font-bold">{standing.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucune équipe dans cette poule</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MatchCardProps {
  match: {
    match: {
      id: number;
      scheduledTime: Date | null;
      status: string | null;
      score1: number | null;
      score2: number | null;
    };
    team1: { id: number; name: string; logoUrl?: string | null } | null;
    team2: { id: number; name: string; logoUrl?: string | null } | null;
    field: { id: number; name: string } | null;
  };
  primaryColor: string;
  showScore?: boolean;
}

function MatchCard({ match, primaryColor, showScore = false }: MatchCardProps) {
  const isCompleted = match.match.status === "completed";
  const hasScore = match.match.score1 !== null && match.match.score2 !== null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            {match.match.scheduledTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(match.match.scheduledTime), "dd MMM - HH:mm", { locale: fr })}
              </div>
            )}
            {match.field && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {match.field.name}
              </div>
            )}
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs">
              <CheckCircle2 className="h-3 w-3" />
              Terminé
            </div>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
          {/* Team 1 */}
          <div className="flex items-center gap-3 justify-end">
            <span className="font-medium text-lg">{match.team1?.name || "TBD"}</span>
            {match.team1?.logoUrl && (
              <img
                src={match.team1.logoUrl}
                alt={match.team1.name}
                className="h-12 w-12 object-contain"
              />
            )}
          </div>

          {/* Score */}
          <div className="text-center">
            {isCompleted && hasScore ? (
              <div className="text-3xl font-bold" style={{ color: primaryColor }}>
                {match.match.score1} - {match.match.score2}
              </div>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">vs</div>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex items-center gap-3">
            {match.team2?.logoUrl && (
              <img
                src={match.team2.logoUrl}
                alt={match.team2.name}
                className="h-12 w-12 object-contain"
              />
            )}
            <span className="font-medium text-lg">{match.team2?.name || "TBD"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
