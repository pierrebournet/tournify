import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import type { Tournament } from "@shared/types";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Shuffle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface StandingsTabProps {
  tournament: Tournament;
}

interface Team {
  id: number;
  name: string;
  logoUrl?: string | null;
}

const EMOJI_OPTIONS = ["⚽", "🏀", "🏐", "🎾", "🏈", "⭐", "🔥", "⚡", "🏆", "🎯", "💎", "🌟"];

function SortableTeamItem({ team }: { team: Team }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: team.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg cursor-move hover:bg-accent"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      {team.logoUrl && (
        <img src={team.logoUrl} alt={team.name} className="h-6 w-6 object-contain rounded" />
      )}
      <span className="font-medium">{team.name}</span>
    </div>
  );
}

export default function StandingsTab({ tournament }: StandingsTabProps) {
  const [activePhaseTab, setActivePhaseTab] = useState("pools");
  const [isCreatePhaseOpen, setIsCreatePhaseOpen] = useState(false);
  const [isCreatePoolOpen, setIsCreatePoolOpen] = useState(false);
  const [isCreateBracketOpen, setIsCreateBracketOpen] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | null>(null);
  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);

  const [newPhase, setNewPhase] = useState({
    name: "",
    type: "pool" as "pool" | "bracket" | "friendly",
  });

  const [newPool, setNewPool] = useState({
    name: "",
    emoji: "⚽",
  });

  const [newBracket, setNewBracket] = useState({
    name: "",
    round: "quarters" as "quarters" | "semis" | "final" | "third_place",
  });

  const utils = trpc.useUtils();

  const { data: teams } = trpc.teams.list.useQuery({ tournamentId: tournament.id });
  const { data: phases } = trpc.phases.list.useQuery({ tournamentId: tournament.id });
  
  const currentPhase = phases?.find(p => p.id === selectedPhaseId);
  const { data: pools } = trpc.pools.list.useQuery(
    { phaseId: selectedPhaseId! },
    { enabled: !!selectedPhaseId && currentPhase?.type === "pool" }
  );

  const { data: brackets } = trpc.brackets.list.useQuery(
    { phaseId: selectedPhaseId! },
    { enabled: !!selectedPhaseId && currentPhase?.type === "bracket" }
  );

  const { data: poolTeams } = trpc.pools.getTeams.useQuery(
    { poolId: selectedPoolId! },
    { enabled: !!selectedPoolId }
  );

  const { data: standings } = trpc.pools.getStandings.useQuery(
    { poolId: selectedPoolId! },
    { enabled: !!selectedPoolId }
  );

  const createPhaseMutation = trpc.phases.create.useMutation({
    onSuccess: (data) => {
      toast.success("Phase créée");
      setIsCreatePhaseOpen(false);
      setNewPhase({ name: "", type: "pool" });
      setSelectedPhaseId(data.id);
      utils.phases.list.invalidate({ tournamentId: tournament.id });
    },
  });

  const createPoolMutation = trpc.pools.create.useMutation({
    onSuccess: () => {
      toast.success("Poule créée");
      setIsCreatePoolOpen(false);
      setNewPool({ name: "", emoji: "⚽" });
      utils.pools.list.invalidate({ phaseId: selectedPhaseId! });
    },
  });

  const createBracketMutation = trpc.brackets.create.useMutation({
    onSuccess: () => {
      toast.success("Bracket créé");
      setIsCreateBracketOpen(false);
      setNewBracket({ name: "", round: "quarters" });
      utils.brackets.list.invalidate({ phaseId: selectedPhaseId! });
    },
  });

  const assignTeamsMutation = trpc.pools.assignTeams.useMutation({
    onSuccess: () => {
      utils.pools.getTeams.invalidate({ poolId: selectedPoolId! });
    },
  });

  const handleCreatePhase = () => {
    if (!newPhase.name) {
      toast.error("Le nom de la phase est requis");
      return;
    }
    
    const order = (phases?.length || 0) + 1;
    createPhaseMutation.mutate({
      tournamentId: tournament.id,
      ...newPhase,
      order,
    });
  };

  const handleCreatePool = () => {
    if (!newPool.name || !selectedPhaseId) {
      toast.error("Le nom de la poule est requis");
      return;
    }

    createPoolMutation.mutate({
      phaseId: selectedPhaseId,
      ...newPool,
    });
  };

  const handleCreateBracket = () => {
    if (!newBracket.name || !selectedPhaseId) {
      toast.error("Le nom du bracket est requis");
      return;
    }

    createBracketMutation.mutate({
      phaseId: selectedPhaseId,
      ...newBracket,
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTeamId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTeamId(null);
    // Drag & drop logic will be implemented when teams are assigned
  };

  const handleRandomDraw = () => {
    if (!pools || !teams || !selectedPhaseId) return;

    const unassignedTeams = teams.filter(
      t => !poolTeams?.some(pt => pt.id === t.id)
    );

    if (unassignedTeams.length === 0) {
      toast.info("Toutes les équipes sont déjà assignées");
      return;
    }

    // Shuffle teams
    const shuffled = [...unassignedTeams].sort(() => Math.random() - 0.5);
    const teamsPerPool = Math.ceil(shuffled.length / pools.length);

    pools.forEach((pool, index) => {
      const startIdx = index * teamsPerPool;
      const endIdx = startIdx + teamsPerPool;
      const teamIds = shuffled.slice(startIdx, endIdx).map(t => t.id);

      if (teamIds.length > 0) {
        assignTeamsMutation.mutate({
          poolId: pool.id,
          teamIds,
        });
      }
    });

    toast.success("Tirage au sort effectué");
  };

  const assignedTeamIds = poolTeams?.map(t => t.id) || [];
  const unassignedTeams = teams?.filter(t => !assignedTeamIds.includes(t.id)) || [];

  return (
    <div className="space-y-6">
      {/* Phase Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Structure du tournoi</CardTitle>
              <CardDescription>
                Organisez votre tournoi en phases (poules, brackets, matchs amicaux)
              </CardDescription>
            </div>
            <Dialog open={isCreatePhaseOpen} onOpenChange={setIsCreatePhaseOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter une phase
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une phase</DialogTitle>
                  <DialogDescription>
                    Définissez le nom et le type de la phase
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="phase-name">Nom de la phase</Label>
                    <Input
                      id="phase-name"
                      placeholder="Ex: Phase de poules"
                      value={newPhase.name}
                      onChange={(e) => setNewPhase({ ...newPhase, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phase-type">Type</Label>
                    <Select
                      value={newPhase.type}
                      onValueChange={(value: any) => setNewPhase({ ...newPhase, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pool">Poules</SelectItem>
                        <SelectItem value="bracket">Élimination directe</SelectItem>
                        <SelectItem value="friendly">Matchs amicaux</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreatePhaseOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreatePhase} disabled={createPhaseMutation.isPending}>
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {phases && phases.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {phases.map((phase) => (
                <Button
                  key={phase.id}
                  variant={selectedPhaseId === phase.id ? "default" : "outline"}
                  onClick={() => setSelectedPhaseId(phase.id)}
                >
                  {phase.emoji} {phase.name}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune phase créée. Commencez par ajouter une phase.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase Content */}
      {selectedPhaseId && currentPhase && (
        <>
          {currentPhase.type === "pool" && (
            <Tabs value={activePhaseTab} onValueChange={setActivePhaseTab}>
              <TabsList>
                <TabsTrigger value="pools">Poules</TabsTrigger>
                <TabsTrigger value="standings">Classements</TabsTrigger>
              </TabsList>

              <TabsContent value="pools" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Gestion des poules</CardTitle>
                        <CardDescription>
                          Créez des poules et assignez les équipes
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="gap-2" onClick={handleRandomDraw}>
                          <Shuffle className="h-4 w-4" />
                          Tirage au sort
                        </Button>
                        <Dialog open={isCreatePoolOpen} onOpenChange={setIsCreatePoolOpen}>
                          <DialogTrigger asChild>
                            <Button className="gap-2">
                              <Plus className="h-4 w-4" />
                              Créer une poule
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Créer une poule</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="pool-name">Nom de la poule</Label>
                                <Input
                                  id="pool-name"
                                  placeholder="Ex: Poule A"
                                  value={newPool.name}
                                  onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Emoji</Label>
                                <div className="grid grid-cols-6 gap-2">
                                  {EMOJI_OPTIONS.map((emoji) => (
                                    <Button
                                      key={emoji}
                                      variant={newPool.emoji === emoji ? "default" : "outline"}
                                      className="text-2xl h-12"
                                      onClick={() => setNewPool({ ...newPool, emoji })}
                                    >
                                      {emoji}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsCreatePoolOpen(false)}>
                                Annuler
                              </Button>
                              <Button onClick={handleCreatePool}>Créer</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {pools && pools.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pools.map((pool) => (
                          <Card
                            key={pool.id}
                            className={`cursor-pointer transition-all ${
                              selectedPoolId === pool.id ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => setSelectedPoolId(pool.id)}
                          >
                            <CardHeader>
                              <CardTitle className="text-lg">
                                {pool.emoji} {pool.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {poolTeams?.length || 0} équipe(s)
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune poule créée
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Team Assignment */}
                {selectedPoolId && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Équipes non assignées</CardTitle>
                      <CardDescription>
                        Glissez-déposez les équipes dans les poules
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DndContext
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="space-y-2">
                          <SortableContext
                            items={unassignedTeams.map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {unassignedTeams.map((team) => (
                              <SortableTeamItem key={team.id} team={team} />
                            ))}
                          </SortableContext>
                        </div>
                        <DragOverlay>
                          {activeTeamId && (
                            <div className="p-3 bg-card border border-border rounded-lg shadow-lg">
                              {teams?.find(t => t.id === activeTeamId)?.name}
                            </div>
                          )}
                        </DragOverlay>
                      </DndContext>
                      {unassignedTeams.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          Toutes les équipes sont assignées
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="standings">
                {selectedPoolId && standings ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Classement - {pools?.find(p => p.id === selectedPoolId)?.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                            <TableRow key={standing.team.id}>
                              <TableCell className="font-bold">{index + 1}</TableCell>
                              <TableCell className="font-medium">{standing.team.name}</TableCell>
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
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Sélectionnez une poule pour voir le classement
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}

          {currentPhase.type === "bracket" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Brackets d'élimination directe</CardTitle>
                    <CardDescription>
                      Créez les matchs à élimination directe
                    </CardDescription>
                  </div>
                  <Dialog open={isCreateBracketOpen} onOpenChange={setIsCreateBracketOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Créer un bracket
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Créer un bracket</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="bracket-name">Nom du bracket</Label>
                          <Input
                            id="bracket-name"
                            placeholder="Ex: Ligue des Champions"
                            value={newBracket.name}
                            onChange={(e) => setNewBracket({ ...newBracket, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bracket-round">Type de round</Label>
                          <Select
                            value={newBracket.round}
                            onValueChange={(value: any) => setNewBracket({ ...newBracket, round: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="quarters">Quarts de finale</SelectItem>
                              <SelectItem value="semis">Demi-finales</SelectItem>
                              <SelectItem value="final">Finale</SelectItem>
                              <SelectItem value="third_place">Match pour la 3e place</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateBracketOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleCreateBracket}>Créer</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {brackets && brackets.length > 0 ? (
                  <div className="space-y-4">
                    {brackets.map((bracket) => (
                      <Card key={bracket.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{bracket.name}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun bracket créé
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
