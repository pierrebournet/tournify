import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from "@dnd-kit/core";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CalendarTabProps {
  tournamentId: number;
}

interface Match {
  id: number;
  team1?: { id: number; name: string; logoUrl?: string | null };
  team2?: { id: number; name: string; logoUrl?: string | null };
  scheduledTime?: Date | null;
  field?: { id: number; name: string };
  status: string;
  score1?: number | null;
  score2?: number | null;
}

export default function CalendarTab({ tournamentId }: CalendarTabProps) {
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
  
  const [generateConfig, setGenerateConfig] = useState({
    poolId: "",
    startTime: "",
    matchDuration: 20,
    breakDuration: 5,
  });

  const [newField, setNewField] = useState({
    name: "",
  });

  const utils = trpc.useUtils();

  const { data: fields } = trpc.fields.list.useQuery({ tournamentId });
  const { data: matches } = trpc.matches.list.useQuery({ tournamentId });
  const { data: pools } = trpc.pools.list.useQuery(
    { phaseId: 0 },
    { enabled: false }
  );

  const createFieldMutation = trpc.fields.create.useMutation({
    onSuccess: () => {
      toast.success("Terrain ajouté");
      setIsAddFieldOpen(false);
      setNewField({ name: "" });
      utils.fields.list.invalidate({ tournamentId });
    },
  });

  const generateMatchesMutation = trpc.matches.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} matchs générés`);
      setIsGenerateOpen(false);
      utils.matches.list.invalidate({ tournamentId });
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la génération");
    },
  });

  const updateMatchMutation = trpc.matches.update.useMutation({
    onSuccess: () => {
      utils.matches.list.invalidate({ tournamentId });
    },
  });

  const handleAddField = () => {
    if (!newField.name) {
      toast.error("Le nom du terrain est requis");
      return;
    }

    const order = (fields?.length || 0) + 1;
    createFieldMutation.mutate({
      tournamentId,
      name: newField.name,
      order,
    });
  };

  const handleGenerateMatches = () => {
    if (!generateConfig.startTime || !fields || fields.length === 0) {
      toast.error("Veuillez configurer l'heure de début et ajouter au moins un terrain");
      return;
    }

    generateMatchesMutation.mutate({
      tournamentId,
      poolId: generateConfig.poolId ? parseInt(generateConfig.poolId) : undefined,
      startTime: generateConfig.startTime,
      matchDuration: generateConfig.matchDuration,
      breakDuration: generateConfig.breakDuration,
      fieldIds: fields.map(f => f.id),
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveMatchId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveMatchId(null);
    // Drag & drop logic for rescheduling will be implemented
  };

  // Group matches by field
  const matchesByField = matches?.reduce((acc, match) => {
    const fieldId = match.field?.id || 0;
    if (!acc[fieldId]) acc[fieldId] = [];
    acc[fieldId]!.push({
      id: match.match.id,
      team1: match.team1 || undefined,
      team2: match.team2 || undefined,
      scheduledTime: match.match.scheduledTime,
      field: match.field || undefined,
      status: match.match.status || "scheduled",
      score1: match.match.score1,
      score2: match.match.score2,
    });
    return acc;
  }, {} as Record<number, Match[]>) || {};

  // Group matches by time slot
  const matchesByTime = matches?.reduce((acc, match) => {
    if (!match.match.scheduledTime) return acc;
    const timeKey = format(new Date(match.match.scheduledTime), "HH:mm");
    if (!acc[timeKey]) acc[timeKey] = [];
    acc[timeKey]!.push({
      id: match.match.id,
      team1: match.team1 || undefined,
      team2: match.team2 || undefined,
      scheduledTime: match.match.scheduledTime,
      field: match.field || undefined,
      status: match.match.status || "scheduled",
      score1: match.match.score1,
      score2: match.match.score2,
    });
    return acc;
  }, {} as Record<string, Match[]>) || {};

  const timeSlots = Object.keys(matchesByTime).sort();

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendrier des matchs</CardTitle>
              <CardDescription>
                Générez automatiquement ou gérez manuellement le planning
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter un terrain
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un terrain</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="field-name">Nom du terrain</Label>
                      <Input
                        id="field-name"
                        placeholder="Ex: Terrain 1"
                        value={newField.name}
                        onChange={(e) => setNewField({ name: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddFieldOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddField}>Ajouter</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Générer automatiquement
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Générer le calendrier</DialogTitle>
                    <DialogDescription>
                      Configurez les paramètres de génération automatique
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-time">Heure de début</Label>
                      <Input
                        id="start-time"
                        type="datetime-local"
                        value={generateConfig.startTime}
                        onChange={(e) => setGenerateConfig({ ...generateConfig, startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="match-duration">Durée d'un match (minutes)</Label>
                      <Input
                        id="match-duration"
                        type="number"
                        value={generateConfig.matchDuration}
                        onChange={(e) => setGenerateConfig({ ...generateConfig, matchDuration: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="break-duration">Pause entre matchs (minutes)</Label>
                      <Input
                        id="break-duration"
                        type="number"
                        value={generateConfig.breakDuration}
                        onChange={(e) => setGenerateConfig({ ...generateConfig, breakDuration: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {fields && fields.length > 0 ? (
                        <p>✓ {fields.length} terrain(x) configuré(s)</p>
                      ) : (
                        <p className="text-destructive">⚠ Aucun terrain configuré</p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleGenerateMatches} disabled={generateMatchesMutation.isPending}>
                      Générer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Fields Overview */}
      {fields && fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Terrains configurés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {field.name}
                  <span className="text-xs text-muted-foreground">
                    ({matchesByField[field.id]?.length || 0} matchs)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Grid */}
      {matches && matches.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Grille horaire</CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-6">
                {timeSlots.map((timeSlot) => (
                  <div key={timeSlot} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {timeSlot}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {matchesByTime[timeSlot]?.map((match) => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <DragOverlay>
                {activeMatchId && (
                  <div className="p-4 bg-card border border-border rounded-lg shadow-lg">
                    Match en déplacement
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Aucun match planifié</p>
            <p className="text-sm">
              Générez automatiquement le calendrier ou ajoutez des matchs manuellement
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 border-green-500/20 text-green-700";
      case "in_progress":
        return "bg-blue-500/10 border-blue-500/20 text-blue-700";
      default:
        return "bg-card border-border";
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor(match.status)} cursor-move hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {match.field && (
            <>
              <MapPin className="h-3 w-3" />
              {match.field.name}
            </>
          )}
        </div>
        {match.status === "completed" && match.score1 !== null && match.score2 !== null && (
          <div className="text-xs font-bold">
            {match.score1} - {match.score2}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {match.team1?.logoUrl && (
              <img src={match.team1.logoUrl} alt="" className="h-5 w-5 object-contain rounded" />
            )}
            <span className="font-medium text-sm">{match.team1?.name || "TBD"}</span>
          </div>
          {match.status === "completed" && <span className="font-bold">{match.score1}</span>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {match.team2?.logoUrl && (
              <img src={match.team2.logoUrl} alt="" className="h-5 w-5 object-contain rounded" />
            )}
            <span className="font-medium text-sm">{match.team2?.name || "TBD"}</span>
          </div>
          {match.status === "completed" && <span className="font-bold">{match.score2}</span>}
        </div>
      </div>
    </div>
  );
}
