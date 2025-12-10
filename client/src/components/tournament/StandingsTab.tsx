import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tournament } from "@shared/types";

interface StandingsTabProps {
  tournament: Tournament;
}

export default function StandingsTab({ tournament }: StandingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Classement</CardTitle>
        <CardDescription>
          Gérez la structure du tournoi (poules, brackets, phases)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Fonctionnalité en cours de développement</p>
          <p className="text-sm">
            Création de poules, brackets d'élimination directe et phases multiples
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
