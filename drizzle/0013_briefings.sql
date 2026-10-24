CREATE TABLE `briefings` (
	`id` text PRIMARY KEY NOT NULL,
	`opportunity_id` text NOT NULL,
	`reference` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`content` text,
	`model` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`error` text,
	`token_hash` text,
	`token_issued_at` integer,
	`expires_at` integer,
	`revoked_at` integer,
	`first_viewed_at` integer,
	`last_viewed_at` integer,
	`view_count` integer DEFAULT 0 NOT NULL,
	`email_status` text DEFAULT 'pending' NOT NULL,
	`email_error` text,
	`email_sent_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `briefings_opportunity_id_unique` ON `briefings` (`opportunity_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `briefings_reference_unique` ON `briefings` (`reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `briefings_token_hash_unique` ON `briefings` (`token_hash`);--> statement-breakpoint
CREATE INDEX `briefings_status_idx` ON `briefings` (`status`);