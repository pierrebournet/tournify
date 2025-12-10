import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ScoresTabProps {
  tournamentId: number;
}

export default function ScoresTab({ tournamentId }: ScoresTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scores</CardTitle>
        <CardDescription>
          Saisie et suivi des résultats des matchs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Fonctionnalité en cours de développement</p>
          <p className="text-sm">
            Saisie rapide, mise à jour automatique des classements
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
