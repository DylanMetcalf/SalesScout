ALTER TABLE `ai_interactions` ADD `cache_write_tokens` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `ai_interactions` ADD `key_source` text;--> statement-breakpoint
ALTER TABLE `feedback` ADD `resolution` text;--> statement-breakpoint
ALTER TABLE `feedback` ADD `resolved_by` text;--> statement-breakpoint
ALTER TABLE `feedback` ADD `resolved_at` integer;