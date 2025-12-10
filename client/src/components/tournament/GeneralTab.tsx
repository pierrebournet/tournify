import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import type { Tournament } from "@shared/types";
import { useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface GeneralTabProps {
  tournament: Tournament;
}

export default function GeneralTab({ tournament }: GeneralTabProps) {
  const [formData, setFormData] = useState({
    name: tournament.name,
    sport: tournament.sport || "",
    gender: tournament.gender || "mixed",
    level: tournament.level || 1,
    ageMin: tournament.ageMin || 0,
    ageMax: tournament.ageMax || 99,
    country: tournament.country || "",
    isEsport: tournament.isEsport || false,
    primaryColor: tournament.primaryColor || "#FF7B00",
  });

  const utils = trpc.useUtils();
  const updateMutation = trpc.tournaments.update.useMutation({
    onSuccess: () => {
      toast.success("Tournoi mis à jour avec succès");
      utils.tournaments.getById.invalidate({ id: tournament.id });
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: tournament.id,
      ...formData,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result?.toString().split(",")[1];
      if (!base64) return;

      // Upload logo functionality to be implemented
      toast.info("Fonctionnalité en cours de développement");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
          <CardDescription>
            Configurez les informations générales de votre tournoi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du tournoi</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport">Sport</Label>
              <Input
                id="sport"
                placeholder="Football, Basketball..."
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Genre</Label>
              <Select
                value={formData.gender}
                onValueChange={(value: any) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Hommes</SelectItem>
                  <SelectItem value="female">Femmes</SelectItem>
                  <SelectItem value="mixed">Mixte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Input
                id="country"
                placeholder="France, Belgique..."
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Niveau (étoiles)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[formData.level]}
                onValueChange={(value) => setFormData({ ...formData, level: value[0] })}
                min={1}
                max={3}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">
                {"⭐".repeat(formData.level)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tranche d'âge</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={formData.ageMin}
                onChange={(e) =>
                  setFormData({ ...formData, ageMin: parseInt(e.target.value) || 0 })
                }
                className="w-24"
              />
              <span>à</span>
              <Input
                type="number"
                value={formData.ageMax}
                onChange={(e) =>
                  setFormData({ ...formData, ageMax: parseInt(e.target.value) || 99 })
                }
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">ans</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="esport">Mode eSport</Label>
              <p className="text-sm text-muted-foreground">
                Tournoi en ligne pour jeux vidéo
              </p>
            </div>
            <Switch
              id="esport"
              checked={formData.isEsport}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isEsport: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Couleur principale</Label>
            <div className="flex items-center gap-4">
              <Input
                id="color"
                type="color"
                value={formData.primaryColor}
                onChange={(e) =>
                  setFormData({ ...formData, primaryColor: e.target.value })
                }
                className="w-24 h-10"
              />
              <Input
                value={formData.primaryColor}
                onChange={(e) =>
                  setFormData({ ...formData, primaryColor: e.target.value })
                }
                placeholder="#FF7B00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Logo du tournoi</Label>
            <div className="flex items-center gap-4">
              {tournament.logoUrl && (
                <img
                  src={tournament.logoUrl}
                  alt="Logo"
                  className="h-16 w-16 object-contain rounded border"
                />
              )}
              <label htmlFor="logo-upload">
                <Button variant="outline" className="gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Télécharger un logo
                  </span>
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
