import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CalendarTabProps {
  tournamentId: number;
}

export default function CalendarTab({ tournamentId }: CalendarTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendrier</CardTitle>
        <CardDescription>
          Planification des matchs et gestion des terrains
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Fonctionnalité en cours de développement</p>
          <p className="text-sm">
            Génération automatique, drag & drop, gestion multi-terrains
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
