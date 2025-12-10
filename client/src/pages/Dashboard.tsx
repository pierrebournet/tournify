import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Calendar, Plus, Search, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: "",
    sport: "",
    format: "pools_brackets" as const,
  });

  const { data: tournaments, isLoading: tournamentsLoading } = trpc.tournaments.list.useQuery();
  const createMutation = trpc.tournaments.create.useMutation({
    onSuccess: (data) => {
      toast.success("Tournoi créé avec succès !");
      setIsCreateDialogOpen(false);
      setNewTournament({ name: "", sport: "", format: "pools_brackets" });
      window.location.href = `/tournament/${data.id}`;
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du tournoi");
    },
  });

  const filteredTournaments = tournaments?.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTournament = () => {
    if (!newTournament.name) {
      toast.error("Le nom du tournoi est requis");
      return;
    }
    createMutation.mutate(newTournament);
  };

  if (loading || tournamentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">TournaPro</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.name || user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/api/oauth/logout"}>
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Mes Tournois</h2>
          <p className="text-muted-foreground text-lg">
            Gérez vos tournois sportifs en toute simplicité
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un tournoi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau Tournoi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau tournoi</DialogTitle>
                <DialogDescription>
                  Remplissez les informations de base pour commencer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du tournoi *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Coupe d'été 2025"
                    value={newTournament.name}
                    onChange={(e) =>
                      setNewTournament({ ...newTournament, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sport">Sport</Label>
                  <Input
                    id="sport"
                    placeholder="Ex: Football, Basketball..."
                    value={newTournament.sport}
                    onChange={(e) =>
                      setNewTournament({ ...newTournament, sport: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format">Format du tournoi</Label>
                  <Select
                    value={newTournament.format}
                    onValueChange={(value: any) =>
                      setNewTournament({ ...newTournament, format: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pools_brackets">Poules + Élimination directe</SelectItem>
                      <SelectItem value="pools_only">Poules uniquement</SelectItem>
                      <SelectItem value="brackets_only">Élimination directe</SelectItem>
                      <SelectItem value="plateau">Plateau</SelectItem>
                      <SelectItem value="friendly">Matchs amicaux</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTournament} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tournaments Grid */}
        {filteredTournaments && filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <Link key={tournament.id} href={`/tournament/${tournament.id}`}>
                <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Trophy className="h-8 w-8 text-primary" />
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {tournament.format === "pools_brackets" && "Poules + Brackets"}
                        {tournament.format === "pools_only" && "Poules"}
                        {tournament.format === "brackets_only" && "Élimination"}
                        {tournament.format === "plateau" && "Plateau"}
                        {tournament.format === "friendly" && "Amical"}
                      </span>
                    </div>
                    <CardTitle className="mt-4">{tournament.name}</CardTitle>
                    <CardDescription>{tournament.sport || "Sport non spécifié"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {tournament.startDate
                          ? new Date(tournament.startDate).toLocaleDateString("fr-FR")
                          : "Date non définie"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {tournament.isPublic ? "Public" : "Privé"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun tournoi trouvé</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Aucun tournoi ne correspond à votre recherche"
                : "Commencez par créer votre premier tournoi"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Créer un tournoi
              </Button>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}
