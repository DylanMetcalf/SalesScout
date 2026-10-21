CREATE TABLE `invites` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`label` text NOT NULL,
	`ai_access` text DEFAULT 'own_key' NOT NULL,
	`ai_monthly_token_limit` integer,
	`max_uses` integer DEFAULT 1 NOT NULL,
	`uses` integer DEFAULT 0 NOT NULL,
	`expires_at` integer,
	`revoked_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invites_code_unique` ON `invites` (`code`);--> statement-breakpoint
ALTER TABLE `accounts` ADD `ai_access` text DEFAULT 'own_key' NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `ai_monthly_token_limit` integer;