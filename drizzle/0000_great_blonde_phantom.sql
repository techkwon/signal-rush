CREATE TABLE `signal_rush_scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_name` text NOT NULL,
	`score` integer NOT NULL,
	`fragments` integer NOT NULL,
	`grade` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
