import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ParticipantsTabProps {
  tournamentId: number;
}

export default function ParticipantsTab({ tournamentId }: ParticipantsTabProps) {
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddRefereeOpen, setIsAddRefereeOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    email: "",
    country: "",
    locker: "",
  });
  const [newReferee, setNewReferee] = useState({ name: "", email: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const { data: teams = [], isLoading: teamsLoading, refetch: refetchTeams } =
    trpc.teams.list.useQuery({ tournamentId });
  const { data: referees = [], refetch: refetchReferees } =
    trpc.referees.list.useQuery({ tournamentId });
  const { data: admins = [] } = trpc.admins.list.useQuery({ tournamentId });

  const createTeamMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      toast.success("Équipe ajoutée avec succès");
      setIsAddTeamOpen(false);
      setNewTeam({ name: "", email: "", country: "", locker: "" });
      setLogoFile(null);
      setLogoPreview("");
      refetchTeams();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const uploadLogoMutation = trpc.teams.uploadLogo.useMutation();

  const deleteTeamMutation = trpc.teams.delete.useMutation({
    onSuccess: () => {
      toast.success("Équipe supprimée");
      refetchTeams();
    },
  });

  const createRefereeMutation = trpc.referees.create.useMutation({
    onSuccess: () => {
      toast.success("Arbitre ajouté");
      setIsAddRefereeOpen(false);
      setNewReferee({ name: "", email: "" });
      refetchReferees();
    },
  });

  const deleteRefereeMutation = trpc.referees.delete.useMutation({
    onSuccess: () => {
      toast.success("Arbitre supprimé");
      refetchReferees();
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTeam = async () => {
    try {
      const result = await createTeamMutation.mutateAsync({
        tournamentId,
        ...newTeam,
      });

      // Upload logo if provided
      if (logoFile && result.id) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          await uploadLogoMutation.mutateAsync({
            teamId: result.id,
            fileData: base64.split(',')[1], // Remove data:image/...;base64, prefix
            mimeType: logoFile.type,
          });
          refetchTeams();
        };
        reader.readAsDataURL(logoFile);
      }
    } catch (error) {
      // Error already handled in mutation
    }
  };

  return (
    <Tabs defaultValue="teams" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="teams">Équipes</TabsTrigger>
        <TabsTrigger value="referees">Arbitres</TabsTrigger>
        <TabsTrigger value="admins">Administrateurs</TabsTrigger>
      </TabsList>

      <TabsContent value="teams">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Équipes inscrites</CardTitle>
              <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
                <Button onClick={() => setIsAddTeamOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une équipe
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une équipe</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations de l'équipe
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nom de l'équipe *</Label>
                      <Input
                        id="name"
                        value={newTeam.name}
                        onChange={(e) =>
                          setNewTeam({ ...newTeam, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="logo">Logo de l'équipe</Label>
                      <div className="flex items-center gap-4">
                        {logoPreview && (
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={logoPreview} alt="Logo preview" />
                          </Avatar>
                        )}
                        <div className="flex-1">
                          <Input
                            id="logo"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newTeam.email}
                        onChange={(e) =>
                          setNewTeam({ ...newTeam, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">Pays</Label>
                      <Input
                        id="country"
                        value={newTeam.country}
                        onChange={(e) =>
                          setNewTeam({ ...newTeam, country: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="locker">Vestiaire</Label>
                      <Input
                        id="locker"
                        value={newTeam.locker}
                        onChange={(e) =>
                          setNewTeam({ ...newTeam, locker: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddTeamOpen(false)}>
                      Annuler
                    </Button>
                    <Button
                      onClick={handleAddTeam}
                      disabled={!newTeam.name || createTeamMutation.isPending}
                    >
                      {logoFile && <Upload className="mr-2 h-4 w-4" />}
                      Ajouter
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <p className="text-muted-foreground">Chargement...</p>
            ) : teams.length === 0 ? (
              <p className="text-muted-foreground">Aucune équipe inscrite</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Vestiaire</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={team.logoUrl || undefined} alt={team.name} />
                          <AvatarFallback>{team.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>{team.email || "-"}</TableCell>
                      <TableCell>{team.country || "-"}</TableCell>
                      <TableCell>{team.locker || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTeamMutation.mutate({ id: team.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="referees">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Arbitres</CardTitle>
              <Dialog open={isAddRefereeOpen} onOpenChange={setIsAddRefereeOpen}>
                <Button onClick={() => setIsAddRefereeOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un arbitre
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un arbitre</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ref-name">Nom</Label>
                      <Input
                        id="ref-name"
                        value={newReferee.name}
                        onChange={(e) =>
                          setNewReferee({ ...newReferee, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ref-email">Email</Label>
                      <Input
                        id="ref-email"
                        type="email"
                        value={newReferee.email}
                        onChange={(e) =>
                          setNewReferee({ ...newReferee, email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddRefereeOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() =>
                        createRefereeMutation.mutate({
                          tournamentId,
                          ...newReferee,
                        })
                      }
                      disabled={!newReferee.name}
                    >
                      Ajouter
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {referees.length === 0 ? (
              <p className="text-muted-foreground">Aucun arbitre</p>
            ) : (
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
                      <TableCell>{referee.name}</TableCell>
                      <TableCell>{referee.email || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            deleteRefereeMutation.mutate({ id: referee.id })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="admins">
        <Card>
          <CardHeader>
            <CardTitle>Administrateurs</CardTitle>
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <p className="text-muted-foreground">Aucun administrateur</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Permissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((item) => (
                    <TableRow key={item.admin.id}>
                      <TableCell>{item.user.name}</TableCell>
                      <TableCell>{item.user.email || "-"}</TableCell>
                      <TableCell>{item.admin.permissions?.join(", ") || "Toutes"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
