import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tournament } from "@shared/types";

interface PresentationTabProps {
  tournament: Tournament;
}

export default function PresentationTab({ tournament }: PresentationTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Présentation</CardTitle>
        <CardDescription>
          Configuration de l'affichage public et personnalisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Fonctionnalité en cours de développement</p>
          <p className="text-sm">
            Site public, diaporama, sponsors, design personnalisé
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
