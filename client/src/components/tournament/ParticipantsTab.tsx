import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ParticipantsTabProps {
  tournamentId: number;
}

export default function ParticipantsTab({ tournamentId }: ParticipantsTabProps) {
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddRefereeOpen, setIsAddRefereeOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", email: "", country: "" });
  const [newReferee, setNewReferee] = useState({ name: "", email: "" });

  const { data: teams, isLoading: teamsLoading } = trpc.teams.list.useQuery({ tournamentId });
  const { data: referees, isLoading: refereesLoading } = trpc.referees.list.useQuery({ tournamentId });

  const utils = trpc.useUtils();

  const createTeamMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      toast.success("Équipe ajoutée");
      setIsAddTeamOpen(false);
      setNewTeam({ name: "", email: "", country: "" });
      utils.teams.list.invalidate({ tournamentId });
    },
  });

  const deleteTeamMutation = trpc.teams.delete.useMutation({
    onSuccess: () => {
      toast.success("Équipe supprimée");
      utils.teams.list.invalidate({ tournamentId });
    },
  });

  const createRefereeMutation = trpc.referees.create.useMutation({
    onSuccess: () => {
      toast.success("Arbitre ajouté");
      setIsAddRefereeOpen(false);
      setNewReferee({ name: "", email: "" });
      utils.referees.list.invalidate({ tournamentId });
    },
  });

  const deleteRefereeMutation = trpc.referees.delete.useMutation({
    onSuccess: () => {
      toast.success("Arbitre supprimé");
      utils.referees.list.invalidate({ tournamentId });
    },
  });

  return (
    <Tabs defaultValue="teams" className="space-y-4">
      <TabsList>
        <TabsTrigger value="teams">Équipes</TabsTrigger>
        <TabsTrigger value="referees">Arbitres</TabsTrigger>
        <TabsTrigger value="admins">Administrateurs</TabsTrigger>
      </TabsList>

      <TabsContent value="teams">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Équipes</CardTitle>
                <CardDescription>Gérez les équipes participantes</CardDescription>
              </div>
              <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter une équipe
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une équipe</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations de l'équipe
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="team-name">Nom de l'équipe *</Label>
                      <Input
                        id="team-name"
                        value={newTeam.name}
                        onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-email">Email</Label>
                      <Input
                        id="team-email"
                        type="email"
                        value={newTeam.email}
                        onChange={(e) => setNewTeam({ ...newTeam, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-country">Pays</Label>
                      <Input
                        id="team-country"
                        value={newTeam.country}
                        onChange={(e) => setNewTeam({ ...newTeam, country: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddTeamOpen(false)}>
                      Annuler
                    </Button>
                    <Button
                      onClick={() =>
                        createTeamMutation.mutate({ tournamentId, ...newTeam })
                      }
                      disabled={!newTeam.name || createTeamMutation.isPending}
                    >
                      Ajouter
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : teams && teams.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>{team.email || "-"}</TableCell>
                      <TableCell>{team.country || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTeamMutation.mutate({ id: team.id })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune équipe ajoutée
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="referees">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Arbitres</CardTitle>
                <CardDescription>Gérez les arbitres du tournoi</CardDescription>
              </div>
              <Dialog open={isAddRefereeOpen} onOpenChange={setIsAddRefereeOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter un arbitre
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un arbitre</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations de l'arbitre
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="referee-name">Nom *</Label>
                      <Input
                        id="referee-name"
                        value={newReferee.name}
                        onChange={(e) =>
                          setNewReferee({ ...newReferee, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referee-email">Email</Label>
                      <Input
                        id="referee-email"
                        type="email"
                        value={newReferee.email}
                        onChange={(e) =>
                          setNewReferee({ ...newReferee, email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddRefereeOpen(false)}>
                      Annuler
                    </Button>
                    <Button
                      onClick={() =>
                        createRefereeMutation.mutate({ tournamentId, ...newReferee })
                      }
                      disabled={!newReferee.name || createRefereeMutation.isPending}
                    >
                      Ajouter
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {refereesLoading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : referees && referees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referees.map((referee) => (
                    <TableRow key={referee.id}>
                      <TableCell className="font-medium">{referee.name}</TableCell>
                      <TableCell>{referee.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRefereeMutation.mutate({ id: referee.id })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucun arbitre ajouté
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="admins">
        <Card>
          <CardHeader>
            <CardTitle>Administrateurs</CardTitle>
            <CardDescription>
              Gérez les co-organisateurs du tournoi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Fonctionnalité à venir
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
