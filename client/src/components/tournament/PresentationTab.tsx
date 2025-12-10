import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tournament } from "@shared/types";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PresentationTabProps {
  tournament: Tournament;
}

export default function PresentationTab({ tournament }: PresentationTabProps) {
  const publicUrl = `${window.location.origin}/public/${tournament.id}`;
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Lien copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPublic = () => {
    window.open(publicUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site public</CardTitle>
          <CardDescription>
            Partagez le lien avec les participants pour qu'ils consultent le calendrier et les classements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL publique</Label>
            <div className="flex gap-2">
              <Input
                value={publicUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleOpenPublic}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            {copied && (
              <p className="text-sm text-green-600">Lien copié dans le presse-papier !</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleOpenPublic} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Voir la page publique
            </Button>
            <Button variant="outline" className="gap-2">
              <QrCode className="h-4 w-4" />
              Générer un code QR
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diaporama</CardTitle>
          <CardDescription>
            Affichage pour grand écran (TV, projecteur)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Fonctionnalité en cours de développement</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
