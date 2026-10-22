CREATE TABLE `credit_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`bucket` text NOT NULL,
	`kind` text NOT NULL,
	`amount` integer NOT NULL,
	`period` text,
	`reason` text NOT NULL,
	`ref_type` text,
	`ref_id` text,
	`idempotency_key` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_ledger_idempotency_key_unique` ON `credit_ledger` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `credit_ledger_account_idx` ON `credit_ledger` (`account_id`,`bucket`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`idempotency_key` text NOT NULL,
	`account_id` text NOT NULL,
	`user_id` text,
	`kind` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_idempotency_key_unique` ON `notifications` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `run_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`company_id` text NOT NULL,
	`run_id` text NOT NULL,
	`name` text NOT NULL,
	`website` text,
	`domain` text,
	`source_urls` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `run_candidates_run_idx` ON `run_candidates` (`run_id`,`status`);--> statement-breakpoint
CREATE TABLE `usage_counters` (
	`account_id` text NOT NULL,
	`metric` text NOT NULL,
	`period` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usage_counters_key` ON `usage_counters` (`account_id`,`metric`,`period`);--> statement-breakpoint
CREATE TABLE `verification_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`channel` text NOT NULL,
	`target` text NOT NULL,
	`code_hash` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`type` text NOT NULL,
	`account_id` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD `plan` text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `plan_source` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `subscription_status` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `billing_customer_code` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `billing_subscription_code` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `billing_email_token` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `current_period_end` integer;--> statement-breakpoint
ALTER TABLE `accounts` ADD `cancel_at_period_end` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `checks` text;--> statement-breakpoint
ALTER TABLE `invites` ADD `plan` text;--> statement-breakpoint
ALTER TABLE `prospects` ADD `skipped_at` integer;--> statement-breakpoint
ALTER TABLE `search_runs` ADD `contact_mode` text DEFAULT 'broad' NOT NULL;--> statement-breakpoint
ALTER TABLE `search_runs` ADD `batches` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone_verified_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `notify_on_keep` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `job_title` text;--> statement-breakpoint
ALTER TABLE `users` ADD `signature` text;