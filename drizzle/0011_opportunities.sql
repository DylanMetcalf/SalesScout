CREATE TABLE `opportunities` (
	`id` text PRIMARY KEY NOT NULL,
	`ref` text NOT NULL,
	`stage` text DEFAULT 'new' NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`role` text,
	`company_name` text,
	`website` text,
	`region` text,
	`contact_preference` text DEFAULT 'email' NOT NULL,
	`problem` text NOT NULL,
	`context` text DEFAULT '{}' NOT NULL,
	`source` text DEFAULT 'website' NOT NULL,
	`consent_at` integer,
	`privacy_version` text,
	`idempotency_key` text NOT NULL,
	`call_requested_at` integer,
	`booking_opened_at` integer,
	`analysis` text,
	`research` text,
	`visibility` text,
	`brief` text,
	`proposal` text,
	`proposal_status` text,
	`project` text,
	`project_status` text,
	`product` text,
	`closed_reason` text,
	`legacy_enquiry_id` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `opportunities_ref_unique` ON `opportunities` (`ref`);--> statement-breakpoint
CREATE UNIQUE INDEX `opportunities_idempotency_key_unique` ON `opportunities` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `opportunities_stage_idx` ON `opportunities` (`stage`);--> statement-breakpoint
CREATE INDEX `opportunities_email_idx` ON `opportunities` (`email`);--> statement-breakpoint
CREATE TABLE `opportunity_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`opportunity_id` text NOT NULL,
	`kind` text NOT NULL,
	`version` integer NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `opportunity_documents_version_idx` ON `opportunity_documents` (`opportunity_id`,`kind`,`version`);--> statement-breakpoint
CREATE TABLE `opportunity_items` (
	`id` text PRIMARY KEY NOT NULL,
	`opportunity_id` text NOT NULL,
	`kind` text NOT NULL,
	`body` text NOT NULL,
	`due_at` integer,
	`done_at` integer,
	`by` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`opportunity_id`) REFERENCES `opportunities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `opportunity_items_opp_idx` ON `opportunity_items` (`opportunity_id`);--> statement-breakpoint
CREATE INDEX `opportunity_items_due_idx` ON `opportunity_items` (`kind`,`done_at`,`due_at`);