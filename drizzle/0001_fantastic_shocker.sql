CREATE TABLE `brackets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phaseId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`round` enum('quarters','semis','final','third_place'),
	`qualificationRule` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brackets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendarEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`fieldId` int,
	`type` enum('pause','ceremony','other') NOT NULL,
	`name` varchar(255) NOT NULL,
	`scheduledTime` timestamp NOT NULL,
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calendarEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`phaseId` int NOT NULL,
	`poolId` int,
	`bracketId` int,
	`team1Id` int,
	`team2Id` int,
	`score1` int,
	`score2` int,
	`scheduledTime` timestamp,
	`fieldId` int,
	`status` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
	`matchNumber` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`birthDate` timestamp,
	`number` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `poolTeams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poolId` int NOT NULL,
	`teamId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `poolTeams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phaseId` int NOT NULL,
	`name` varchar(50) NOT NULL,
	`emoji` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pools_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `slideshowSlides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`type` enum('standings','calendar','scores','custom') NOT NULL,
	`content` json,
	`duration` int DEFAULT 10,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slideshowSlides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sponsors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`logoUrl` text NOT NULL,
	`blockNumber` int DEFAULT 1,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sponsors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`logoUrl` text,
	`email` varchar(320),
	`country` varchar(100),
	`locker` varchar(50),
	`isPaid` boolean DEFAULT false,
	`isPresent` boolean DEFAULT false,
	`isExempt` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournamentAdmins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`userId` int NOT NULL,
	`permissions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tournamentAdmins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournamentPhases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('pool','bracket','friendly') NOT NULL,
	`order` int NOT NULL,
	`emoji` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tournamentPhases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`sport` varchar(100),
	`gender` enum('male','female','mixed'),
	`level` int,
	`ageMin` int,
	`ageMax` int,
	`country` varchar(100),
	`isEsport` boolean DEFAULT false,
	`format` enum('pools_brackets','pools_only','brackets_only','plateau','friendly') NOT NULL,
	`startDate` timestamp,
	`endDate` timestamp,
	`dates` json,
	`locations` json,
	`primaryColor` varchar(7) DEFAULT '#FF7B00',
	`logoUrl` text,
	`backgroundUrl` text,
	`pointsWin` int DEFAULT 3,
	`pointsDraw` int DEFAULT 1,
	`pointsLoss` int DEFAULT 0,
	`isPublic` boolean DEFAULT false,
	`showInApp` boolean DEFAULT false,
	`publicUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tournaments_id` PRIMARY KEY(`id`),
	CONSTRAINT `tournaments_slug_unique` UNIQUE(`slug`)
);
