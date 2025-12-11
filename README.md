# 🏆 TournaPro - Plateforme de Gestion de Tournois Sportifs

Une plateforme web moderne et complète pour organiser et gérer des tournois sportifs de tous types.

## ✨ Fonctionnalités

### Gestion de Tournois
- **Création et configuration** : Créez des tournois avec informations détaillées (sport, dates, lieux, niveau)
- **Formats multiples** : Poules + Brackets, Poules uniquement, Brackets uniquement, Plateau, Matchs amicaux
- **Personnalisation** : Couleurs personnalisées, logos, images de fond
- **Visibilité** : Tournois publics ou privés avec URL unique

### Système de Phases et Poules
- **Phases multiples** : Organisez votre tournoi en plusieurs phases (poules, quarts, demi-finales, finale)
- **Gestion des poules** : Créez des poules avec emojis personnalisés
- **Tirage au sort** : Répartition automatique et aléatoire des équipes entre les poules
- **Drag & Drop** : Assignez manuellement les équipes aux poules par glisser-déposer
- **Classements automatiques** : Calcul en temps réel des classements avec points, différence de buts, etc.

### Calendrier et Matchs
- **Gestion des terrains** : Configurez plusieurs terrains avec noms personnalisés
- **Génération automatique** : Créez automatiquement tous les matchs d'une phase/poule
- **Planification intelligente** : Distribution optimale des matchs sur les terrains disponibles
- **Sélecteur de phase/poule** : Générez le calendrier pour une phase ou poule spécifique
- **Modification manuelle** : Ajoutez ou modifiez des matchs individuellement

### Gestion des Participants
- **Équipes** : Ajoutez des équipes avec logos, coordonnées, vestiaires
- **Upload de logos** : Téléchargez et affichez les logos d'équipes partout
- **Arbitres** : Gérez la liste des arbitres avec leurs coordonnées
- **Administrateurs** : Ajoutez des co-organisateurs avec permissions personnalisées

### Saisie et Suivi des Scores
- **Saisie en temps réel** : Entrez les scores pendant ou après les matchs
- **Validation** : Scores validés entre 0 et 99
- **Mise à jour automatique** : Les classements se mettent à jour instantanément
- **Historique** : Consultez tous les résultats passés

### Interface Publique
- **Page publique** : URL unique pour chaque tournoi (ex: tournoi.manus.space/mon-tournoi)
- **Consultation** : Classements, calendrier, résultats accessibles publiquement
- **Design moderne** : Interface responsive et élégante
- **Partage** : Partagez facilement votre tournoi

## 🛠️ Technologies

### Frontend
- **React 19** : Framework UI moderne avec hooks
- **Tailwind CSS 4** : Styling utility-first avec design system personnalisé
- **shadcn/ui** : Composants UI accessibles et personnalisables
- **Wouter** : Routing léger et performant
- **@dnd-kit** : Drag & drop accessible et performant
- **Sonner** : Notifications toast élégantes
- **date-fns** : Manipulation de dates

### Backend
- **Express 4** : Serveur Node.js robuste
- **tRPC 11** : API type-safe end-to-end sans code generation
- **Drizzle ORM** : ORM TypeScript moderne et performant
- **Zod** : Validation de schémas TypeScript-first
- **Superjson** : Sérialisation avancée (Date, Map, Set, etc.)

### Base de Données
- **MySQL / TiDB** : Base de données relationnelle
- **Migrations automatiques** : Gestion de schéma avec Drizzle Kit

### Authentification
- **Manus OAuth** : Authentification sécurisée intégrée
- **Sessions** : Gestion de sessions avec cookies HTTP-only

### Tests
- **Vitest** : Framework de test moderne et rapide
- **Couverture complète** : Tests unitaires et d'intégration

## 📦 Installation

```bash
# Cloner le repository
git clone https://github.com/pierrebournet/tournify.git
cd tournify

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
# (Les variables sont automatiquement injectées dans l'environnement Manus)

# Pousser le schéma vers la base de données
pnpm db:push

# Lancer le serveur de développement
pnpm dev
```

## 🧪 Tests

```bash
# Exécuter tous les tests
pnpm test

# Tests en mode watch
pnpm test:watch

# Coverage
pnpm test:coverage
```

## 📝 Structure du Projet

```
tournify/
├── client/                 # Application React
│   ├── public/            # Assets statiques
│   └── src/
│       ├── components/    # Composants React
│       │   ├── ui/       # Composants shadcn/ui
│       │   └── tournament/ # Composants spécifiques tournoi
│       ├── pages/        # Pages de l'application
│       ├── lib/          # Utilitaires et configuration
│       └── contexts/     # Contextes React
├── server/                # Backend Express + tRPC
│   ├── _core/           # Infrastructure (auth, OAuth, LLM)
│   ├── routers.ts       # Procédures tRPC
│   ├── db.ts            # Fonctions de base de données
│   └── *.test.ts        # Tests Vitest
├── drizzle/              # Schéma et migrations
│   └── schema.ts        # Définition des tables
├── shared/               # Types et constantes partagés
└── storage/              # Helpers S3 pour fichiers
```

## 🎯 Workflow de Développement

1. **Modifier le schéma** : `drizzle/schema.ts`
2. **Pousser les changements** : `pnpm db:push`
3. **Ajouter des helpers DB** : `server/db.ts`
4. **Créer des procédures tRPC** : `server/routers.ts`
5. **Utiliser dans le frontend** : `trpc.*.useQuery/useMutation`
6. **Écrire des tests** : `server/*.test.ts`

## 🚀 Déploiement

Le projet est conçu pour être déployé sur la plateforme Manus avec hébergement intégré et support de domaines personnalisés.

## 📄 Licence

Ce projet est développé dans le cadre de la plateforme Manus.

## 👤 Auteur

**Pierre Bournet**

---

Développé avec ❤️ sur [Manus](https://manus.im)
