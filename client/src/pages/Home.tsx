import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Trophy, Users, Calendar, Award, BarChart3, Globe } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background"></div>
        <div className="container relative py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Trophy className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              TournaPro
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              La plateforme complète pour organiser et gérer vos tournois sportifs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <a href={getLoginUrl()}>Commencer gratuitement</a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Découvrir
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/30">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Gestion des participants"
              description="Ajoutez équipes, joueurs, arbitres et administrateurs en quelques clics"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Classements automatiques"
              description="Calcul en temps réel avec critères de départage personnalisables"
            />
            <FeatureCard
              icon={<Calendar className="h-8 w-8" />}
              title="Calendrier intelligent"
              description="Génération automatique optimisée ou planification manuelle"
            />
            <FeatureCard
              icon={<Award className="h-8 w-8" />}
              title="Formats multiples"
              description="Poules, élimination directe, plateau, ou matchs amicaux"
            />
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="Affichage public"
              description="Site web dédié avec URL unique et code QR pour vos participants"
            />
            <FeatureCard
              icon={<Trophy className="h-8 w-8" />}
              title="Personnalisation"
              description="Logos, couleurs, sponsors - créez l'identité de votre tournoi"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Prêt à organiser votre prochain tournoi ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Rejoignez des milliers d'organisateurs qui font confiance à TournaPro
            </p>
            <Button size="lg" className="text-lg px-8" asChild>
              <a href={getLoginUrl()}>Créer mon premier tournoi</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 TournaPro. Plateforme de gestion de tournois sportifs.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-all">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
