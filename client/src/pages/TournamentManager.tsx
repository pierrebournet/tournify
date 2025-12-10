import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Trophy } from "lucide-react";
import { useRoute } from "wouter";
import { Link } from "wouter";

// Import tab components (to be created)
import GeneralTab from "@/components/tournament/GeneralTab";
import ParticipantsTab from "@/components/tournament/ParticipantsTab";
import StandingsTab from "@/components/tournament/StandingsTab";
import CalendarTab from "@/components/tournament/CalendarTab";
import ScoresTab from "@/components/tournament/ScoresTab";
import PresentationTab from "@/components/tournament/PresentationTab";

export default function TournamentManager() {
  const { user, loading: authLoading } = useAuth();
  const [, params] = useRoute("/tournament/:id");
  const tournamentId = params?.id ? parseInt(params.id) : 0;

  const { data: tournament, isLoading } = trpc.tournaments.getById.useQuery(
    { id: tournamentId },
    { enabled: tournamentId > 0 }
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Tournoi introuvable</h2>
          <p className="text-muted-foreground mb-4">
            Ce tournoi n'existe pas ou vous n'avez pas accès.
          </p>
          <Link href="/">
            <Button>Retour au dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">{tournament.name}</h1>
                  <p className="text-sm text-muted-foreground">{tournament.sport}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.name || user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="standings">Classement</TabsTrigger>
            <TabsTrigger value="calendar">Calendrier</TabsTrigger>
            <TabsTrigger value="scores">Scores</TabsTrigger>
            <TabsTrigger value="presentation">Présentation</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <GeneralTab tournament={tournament} />
          </TabsContent>

          <TabsContent value="participants" className="space-y-4">
            <ParticipantsTab tournamentId={tournament.id} />
          </TabsContent>

          <TabsContent value="standings" className="space-y-4">
            <StandingsTab tournament={tournament} />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <CalendarTab tournamentId={tournament.id} />
          </TabsContent>

          <TabsContent value="scores" className="space-y-4">
            <ScoresTab tournamentId={tournament.id} />
          </TabsContent>

          <TabsContent value="presentation" className="space-y-4">
            <PresentationTab tournament={tournament} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
