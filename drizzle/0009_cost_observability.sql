CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text,
	`updated_by` text,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `ai_interactions` ADD `cache_read_tokens` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `ai_interactions` ADD `web_fetches` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `ai_interactions` ADD `run_id` text;--> statement-breakpoint
ALTER TABLE `ai_interactions` ADD `prospect_id` text;--> statement-breakpoint
ALTER TABLE `ai_interactions` ADD `cost_usd_micros` integer;--> statement-breakpoint
ALTER TABLE `ai_interactions` ADD `pricing_version` text;--> statement-breakpoint
CREATE INDEX `ai_interactions_run_idx` ON `ai_interactions` (`run_id`);--> statement-breakpoint
CREATE INDEX `ai_interactions_created_idx` ON `ai_interactions` (`created_at`);--> statement-breakpoint
ALTER TABLE `search_runs` ADD `cancel_requested_at` integer;