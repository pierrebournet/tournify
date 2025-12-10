# Tournify - TODO List

## Phase 1 : Schéma de Base de Données
- [x] Créer table tournaments (nom, dates, lieux, sport, genre, niveau, âge, pays, mode eSport, couleur, logo, image fond)
- [x] Créer table teams (nom, logo, email, pays, vestiaire, payé, présent)
- [x] Créer table players (nom, date naissance, numéro, équipe)
- [x] Créer table tournament_phases (type: poule/bracket/amical, nom, emoji, ordre)
- [x] Créer table pools (nom, emoji, phase)
- [x] Créer table brackets (nom, type: quarts/demis/finale, phase)
- [x] Créer table matches (équipe1, équipe2, score1, score2, heure, terrain, statut, phase, pool/bracket)
- [x] Créer table fields (nom, tournoi)
- [x] Créer table referees (nom, email, tournoi)
- [x] Créer table tournament_admins (userId, tournamentId, permissions)
- [x] Créer table sponsors (nom, logo, tournoi, ordre)
- [x] Créer table tournament_settings (affichage public, notifications, colonnes classement)

## Phase 2 : Backend tRPC - Gestion des Tournois
- [x] Procédure tournaments.create (création tournoi avec infos de base)
- [x] Procédure tournaments.list (liste des tournois de l'utilisateur)
- [x] Procédure tournaments.getById (détails complet d'un tournoi)
- [x] Procédure tournaments.update (mise à jour infos générales)
- [x] Procédure tournaments.delete (suppression tournoi)
- [x] Procédure tournaments.uploadLogo (upload logo S3)
- [x] Procédure tournaments.uploadBackground (upload image fond S3)

## Phase 3 : Backend tRPC - Gestion des Participants
- [x] Procédure teams.create (ajout équipe avec logo)
- [x] Procédure teams.list (liste équipes par tournoi)
- [x] Procédure teams.update (modification équipe)
- [x] Procédure teams.delete (suppression équipe)
- [x] Procédure teams.uploadLogo (upload logo équipe S3)
- [ ] Procédure teams.export (export CSV/Excel)
- [x] Procédure players.create (ajout joueur à équipe)
- [ ] Procédure players.update (modification joueur)
- [x] Procédure players.delete (suppression joueur)
- [x] Procédure referees.create (ajout arbitre)
- [x] Procédure referees.list (liste arbitres)
- [x] Procédure referees.delete (suppression arbitre)
- [x] Procédure admins.invite (invitation administrateur)
- [x] Procédure admins.list (liste administrateurs)
- [x] Procédure admins.remove (retrait administrateur)

## Phase 4 : Backend tRPC - Structure de Tournoi (Classement)
- [x] Procédure phases.create (création phase: poule/bracket/amical)
- [x] Procédure phases.list (liste phases par tournoi)
- [x] Procédure phases.delete (suppression phase)
- [x] Procédure pools.create (création poule avec emoji)
- [x] Procédure pools.assignTeams (assignation équipes manuellement)
- [ ] Procédure pools.randomDraw (tirage au sort automatique)
- [x] Procédure brackets.create (création bracket élimination)
- [x] Procédure brackets.configure (configuration qualifications depuis poules)
- [x] Procédure standings.calculate (calcul classement avec critères départage)

## Phase 5 : Backend tRPC - Calendrier
- [x] Procédure fields.create (ajout terrain)
- [x] Procédure fields.list (liste terrains)
- [x] Procédure fields.delete (suppression terrain)
- [ ] Procédure matches.generate (génération automatique calendrier)
- [x] Procédure matches.list (liste matchs par tournoi)
- [x] Procédure matches.update (modification horaire/terrain manuellement)
- [ ] Procédure matches.addPause (ajout pause)
- [ ] Procédure matches.addEvent (ajout événement spécial)
- [ ] Procédure matches.export (export calendrier)

## Phase 6 : Backend tRPC - Scores
- [x] Procédure scores.submit (saisie score match)
- [x] Procédure scores.update (modification score)
- [ ] Procédure scores.getProgress (progression matchs complétés)
- [ ] Procédure scores.export (export résultats)
- [x] Logique de mise à jour automatique du classement après saisie score

## Phase 7 : Backend tRPC - Présentation
- [x] Procédure presentation.updateSettings (activation site public, app mobile)
- [x] Procédure presentation.generatePublicUrl (génération URL unique)
- [ ] Procédure presentation.generateQRCode (génération code QR)
- [x] Procédure sponsors.create (ajout sponsor avec logo S3)
- [x] Procédure sponsors.list (liste sponsors)
- [x] Procédure sponsors.delete (suppression sponsor)
- [ ] Procédure slideshow.configure (configuration diaporama)

## Phase 8 : Frontend - Authentification & Dashboard
- [x] Page de connexion avec redirection OAuth Manus
- [x] Dashboard principal avec liste des tournois
- [x] Barre de recherche de tournois
- [x] Bouton "Nouveau Tournoi" avec modal de création
- [x] Affichage des cartes de tournois (nom, date, statut)

## Phase 9 : Frontend - Onglet Général
- [x] Formulaire informations de base (nom, dates, lieux, divisions)
- [x] Sélecteur de sport avec icônes
- [x] Sélecteur de genre (Homme, Femme, Mixte)
- [x] Système d'étoiles pour le niveau (1-3)
- [x] Curseur pour tranche d'âge
- [x] Case à cocher mode eSport
- [x] Section comptage de points avec règles personnalisables

## Phase 10 : Frontend - Onglet Participants
- [x] Sous-onglet Équipes avec tableau
- [x] Bouton "Ajouter une équipe" avec modal
- [ ] Upload de logo d'équipe avec prévisualisation
- [x] Colonnes personnalisables (présent, payé, email, etc.)
- [ ] Bouton "Exporter" avec options CSV/Excel
- [x] Sous-onglet Arbitres avec gestion
- [x] Sous-onglet Administrateurs avec invitations

## Phase 11 : Frontend - Onglet Classement
- [ ] Bouton "Ajouter une phase" avec sélection type
- [ ] Interface de création de poules avec sélecteur emoji
- [ ] Drag & drop pour assignation manuelle des équipes
- [ ] Bouton "Tirage au sort" pour répartition automatique
- [ ] Interface de création de brackets avec arbre visuel
- [ ] Configuration des qualifications (1er de poule → bracket X)
- [ ] Affichage visuel des brackets avec matchs numérotés
- [ ] Tableau de classement en temps réel par poule

## Phase 12 : Frontend - Onglet Calendrier
- [ ] Grille horaire visuelle par terrain
- [ ] Bouton "Ajouter un terrain"
- [ ] Bouton "Générer calendrier automatiquement" avec paramètres
- [ ] Drag & drop pour déplacer les matchs
- [ ] Configuration durée des matchs
- [ ] Boutons "Pause" et "Événement" par terrain
- [ ] Filtres par poule/bracket/tour/terrain
- [ ] Bouton "Exporter calendrier"

## Phase 13 : Frontend - Onglet Scores
- [ ] Liste des matchs groupés par heure et terrain
- [ ] Bouton "Remplir" par match avec modal de saisie
- [ ] Barre de progression (X/Y matchs complétés)
- [ ] Bouton "Classement" pour affichage en temps réel
- [ ] Bouton "Exporter résultats"
- [ ] Mise à jour automatique du classement après saisie

## Phase 14 : Frontend - Onglet Présentation
- [ ] Sous-onglet Site Web et Application
- [ ] Toggle activation site web public
- [ ] Affichage URL unique et code QR
- [ ] Toggle publication dans app mobile
- [ ] Configuration des pages affichables (Tournoi, Classements, Calendrier, etc.)
- [ ] Sous-onglet Diaporama avec création de diapositives
- [ ] Sous-onglet Design avec sélecteur de couleur
- [ ] Upload logo tournoi
- [ ] Upload image d'arrière-plan
- [ ] Gestion des sponsors (jusqu'à 12 par bloc)

## Phase 15 : Frontend - Site Public
- [ ] Page publique avec URL unique (/live/:tournamentSlug)
- [ ] Affichage des informations du tournoi
- [ ] Affichage du calendrier des matchs
- [ ] Affichage des classements par poule
- [ ] Affichage des scores en temps réel
- [ ] Design responsive avec thème personnalisé
- [ ] Code QR pour partage rapide

## Phase 16 : Fonctionnalités Avancées
- [ ] Système de notifications (création tournoi, changement calendrier, nouveaux scores)
- [ ] Support de 5 formats de tournoi (Poules+Brackets, Poules seules, Élimination directe, Plateau, Matchs amicaux)
- [ ] Calcul automatique des classements avec tous les critères de départage
- [ ] Gestion des équipes "exempt" pour équilibrer les poules
- [ ] Support multi-langues (FR, EN, ES, DE, NL, PL)

## Phase 17 : Design & UX
- [x] Thème moderne inspiré de Superfan Studio et TST7V7
- [x] Animations fluides et transitions
- [x] Typographie moderne et professionnelle
- [x] Palette de couleurs dynamique et sportive
- [x] Interface épurée et intuitive
- [x] Design responsive (desktop, tablette, mobile)

## Phase 18 : Tests & Optimisations
- [ ] Tests unitaires des procédures tRPC critiques
- [ ] Tests d'intégration du calcul de classement
- [ ] Tests de génération automatique de calendrier
- [ ] Tests de performance avec tournois de grande envergure (100+ équipes)
- [ ] Validation de la mise à jour en temps réel
- [ ] Tests de compatibilité multi-navigateurs

## Nouvelles Fonctionnalités - Système de Classement Avancé

### Interface de Gestion des Poules
- [x] Bouton "Ajouter une phase" avec sélection du type (Poule/Bracket/Amical)
- [x] Interface de création de poule avec nom et sélecteur d'emoji
- [x] Zone de drag & drop pour assigner les équipes aux poules
- [x] Affichage visuel des équipes non assignées
- [x] Bouton "Tirage au sort" pour répartition automatique
- [x] Sauvegarde automatique des assignations

### Interface de Brackets d'Élimination
- [x] Création de brackets avec nom personnalisé
- [x] Sélection du type de bracket (Quarts, Demis, Finale, Match 3e place)
- [ ] Configuration des règles de qualification depuis les poules
- [ ] Arbre visuel des matchs d'élimination directe
- [ ] Génération automatique des matchs de bracket

### Calcul Automatique des Classements
- [x] Tableau de classement par poule en temps réel
- [x] Calcul des points (Victoire 3pts, Nul 1pt, Défaite 0pts)
- [x] Critères de départage (différence de buts, buts marqués, confrontation directe)
- [x] Mise à jour automatique après saisie de scores
- [x] Affichage des statistiques (J, V, N, D, BP, BC, Diff, Pts)
- [ ] Qualification automatique vers les brackets selon les règles
