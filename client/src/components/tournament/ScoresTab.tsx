import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Circle, Clock, MapPin, Save, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ScoresTabProps {
  tournamentId: number;
}

interface MatchWithDetails {
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
}

export default function ScoresTab({ tournamentId }: ScoresTabProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingScores, setEditingScores] = useState<Record<number, { score1: string; score2: string }>>({});

  const utils = trpc.useUtils();
  const { data: matches, isLoading } = trpc.matches.list.useQuery({ tournamentId });

  const submitScoreMutation = trpc.matches.submitScore.useMutation({
    onSuccess: () => {
      toast.success("Score enregistré");
      utils.matches.list.invalidate({ tournamentId });
      utils.pools.getStandings.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    },
  });

  const handleScoreChange = (matchId: number, team: "score1" | "score2", value: string) => {
    // Validate score (0-99)
    if (value && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 99)) {
      return;
    }

    setEditingScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        score1: team === "score1" ? value : (prev[matchId]?.score1 || ""),
        score2: team === "score2" ? value : (prev[matchId]?.score2 || ""),
      },
    }));
  };

  const handleSubmitScore = (match: MatchWithDetails) => {
    const scores = editingScores[match.match.id];
    
    if (!scores || scores.score1 === "" || scores.score2 === "") {
      toast.error("Veuillez saisir les deux scores");
      return;
    }

    submitScoreMutation.mutate({
      matchId: match.match.id,
      score1: parseInt(scores.score1),
      score2: parseInt(scores.score2),
    });

    // Clear editing state
    setEditingScores(prev => {
      const newState = { ...prev };
      delete newState[match.match.id];
      return newState;
    });
  };

  // Calculate statistics
  const stats = matches?.reduce(
    (acc, match) => {
      if (match.match.status === "completed") {
        acc.completed++;
        if (match.match.score1 !== null && match.match.score2 !== null) {
          acc.totalGoals += match.match.score1 + match.match.score2;
        }
      } else if (match.match.status === "in_progress") {
        acc.inProgress++;
      } else {
        acc.scheduled++;
      }
      acc.total++;
      return acc;
    },
    { total: 0, completed: 0, inProgress: 0, scheduled: 0, totalGoals: 0 }
  ) || { total: 0, completed: 0, inProgress: 0, scheduled: 0, totalGoals: 0 };

  const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const averageGoals = stats.completed > 0 ? (stats.totalGoals / stats.completed).toFixed(1) : "0.0";

  // Filter matches
  const filteredMatches = matches?.filter((match) => {
    if (filterStatus === "all") return true;
    return match.match.status === filterStatus;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Progression</CardDescription>
            <CardTitle className="text-3xl">{Math.round(progressPercentage)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.completed} / {stats.total} matchs terminés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Matchs à venir</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Clock className="h-6 w-6 text-blue-500" />
              {stats.scheduled}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Matchs planifiés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>En cours</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Circle className="h-6 w-6 text-orange-500 animate-pulse" />
              {stats.inProgress}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Matchs en direct
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Moyenne de buts</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-500" />
              {averageGoals}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.totalGoals} buts marqués
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Match List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Saisie des scores</CardTitle>
              <CardDescription>
                Enregistrez les résultats des matchs en temps réel
              </CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les matchs</SelectItem>
                <SelectItem value="scheduled">À venir</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des matchs...
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun match trouvé
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match) => (
                <MatchScoreCard
                  key={match.match.id}
                  match={match}
                  editingScores={editingScores[match.match.id]}
                  onScoreChange={handleScoreChange}
                  onSubmit={handleSubmitScore}
                  isSubmitting={submitScoreMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface MatchScoreCardProps {
  match: MatchWithDetails;
  editingScores?: { score1: string; score2: string };
  onScoreChange: (matchId: number, team: "score1" | "score2", value: string) => void;
  onSubmit: (match: MatchWithDetails) => void;
  isSubmitting: boolean;
}

function MatchScoreCard({ match, editingScores, onScoreChange, onSubmit, isSubmitting }: MatchScoreCardProps) {
  const isCompleted = match.match.status === "completed";

  const getStatusBadge = () => {
    switch (match.match.status) {
      case "completed":
        return (
          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            <CheckCircle2 className="h-3 w-3" />
            Terminé
          </div>
        );
      case "in_progress":
        return (
          <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            <Circle className="h-3 w-3 animate-pulse" />
            En cours
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            <Clock className="h-3 w-3" />
            À venir
          </div>
        );
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Match Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {match.match.scheduledTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(match.match.scheduledTime), "HH:mm", { locale: fr })}
                </div>
              )}
              {match.field && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {match.field.name}
                </div>
              )}
            </div>
            {getStatusBadge()}
          </div>

          {/* Teams and Scores */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
            {/* Team 1 */}
            <div className="flex items-center gap-3">
              {match.team1?.logoUrl && (
                <img
                  src={match.team1.logoUrl}
                  alt={match.team1.name}
                  className="h-10 w-10 object-contain rounded"
                />
              )}
              <span className="font-medium">{match.team1?.name || "TBD"}</span>
            </div>

            {/* Score Input or Display */}
            <div className="flex items-center gap-3">
              {isCompleted && !editingScores ? (
                <div className="text-2xl font-bold">
                  {match.match.score1} - {match.match.score2}
                </div>
              ) : (
                <>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    className="w-16 text-center text-xl font-bold"
                    value={editingScores?.score1 ?? (match.match.score1?.toString() || "")}
                    onChange={(e) => onScoreChange(match.match.id, "score1", e.target.value)}
                    placeholder="0"
                  />
                  <span className="text-xl font-bold text-muted-foreground">-</span>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    className="w-16 text-center text-xl font-bold"
                    value={editingScores?.score2 ?? (match.match.score2?.toString() || "")}
                    onChange={(e) => onScoreChange(match.match.id, "score2", e.target.value)}
                    placeholder="0"
                  />
                </>
              )}
            </div>

            {/* Team 2 */}
            <div className="flex items-center gap-3 justify-end">
              <span className="font-medium">{match.team2?.name || "TBD"}</span>
              {match.team2?.logoUrl && (
                <img
                  src={match.team2.logoUrl}
                  alt={match.team2.name}
                  className="h-10 w-10 object-contain rounded"
                />
              )}
            </div>
          </div>

          {/* Action Button */}
          {(!isCompleted || editingScores) && (
            <div className="flex justify-end">
              <Button
                onClick={() => onSubmit(match)}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isCompleted ? "Modifier le score" : "Enregistrer"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
