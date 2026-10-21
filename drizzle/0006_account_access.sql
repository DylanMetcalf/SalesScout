ALTER TABLE `accounts` ADD `suspended_at` integer;--> statement-breakpoint
ALTER TABLE `accounts` ADD `access_until` integer;--> statement-breakpoint
ALTER TABLE `invites` ADD `email` text;--> statement-breakpoint
ALTER TABLE `invites` ADD `access_days` integer;