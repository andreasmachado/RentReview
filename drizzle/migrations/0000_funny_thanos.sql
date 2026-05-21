CREATE TABLE `email_verification_tokens` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`landlord_id` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`postcode` text,
	`latitude` real,
	`longitude` real,
	`property_type` text DEFAULT 'apartment' NOT NULL,
	`bedrooms` integer,
	`description` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`landlord_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`reviewer_id` text NOT NULL,
	`reviewed_id` text NOT NULL,
	`property_id` text,
	`reviewed_role` text NOT NULL,
	`rating` integer NOT NULL,
	`description` text NOT NULL,
	`rating_details` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`city` text,
	`bio` text,
	`email_verified` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_verification_tokens_token_unique` ON `email_verification_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `idx_properties_landlord` ON `properties` (`landlord_id`);--> statement-breakpoint
CREATE INDEX `idx_properties_city` ON `properties` (`city`);--> statement-breakpoint
CREATE INDEX `idx_properties_type` ON `properties` (`property_type`);--> statement-breakpoint
CREATE INDEX `idx_properties_coords` ON `properties` (`latitude`,`longitude`);--> statement-breakpoint
CREATE INDEX `idx_reviews_reviewer` ON `reviews` (`reviewer_id`);--> statement-breakpoint
CREATE INDEX `idx_reviews_reviewed` ON `reviews` (`reviewed_id`);--> statement-breakpoint
CREATE INDEX `idx_reviews_property` ON `reviews` (`property_id`);--> statement-breakpoint
CREATE INDEX `idx_reviews_reviewed_role` ON `reviews` (`reviewed_id`,`reviewed_role`);--> statement-breakpoint
CREATE INDEX `idx_reviews_rating` ON `reviews` (`rating`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_name` ON `users` (`name`);--> statement-breakpoint
CREATE INDEX `idx_users_city` ON `users` (`city`);