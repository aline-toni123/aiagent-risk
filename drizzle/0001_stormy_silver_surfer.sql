CREATE TABLE `risk_alerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`assessment_id` integer NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`severity` text NOT NULL,
	`is_resolved` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assessment_id`) REFERENCES `risk_assessments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `risk_alerts_user_id_idx` ON `risk_alerts` (`user_id`);--> statement-breakpoint
CREATE INDEX `risk_alerts_assessment_id_idx` ON `risk_alerts` (`assessment_id`);--> statement-breakpoint
CREATE TABLE `risk_assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`applicant_name` text NOT NULL,
	`credit_score` integer NOT NULL,
	`income` real NOT NULL,
	`debt_to_income_ratio` real NOT NULL,
	`employment_history` text,
	`risk_level` text NOT NULL,
	`ai_score` real NOT NULL,
	`analysis_summary` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `risk_assessments_user_id_idx` ON `risk_assessments` (`user_id`);--> statement-breakpoint
CREATE TABLE `risk_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`assessment_id` integer NOT NULL,
	`report_summary` text NOT NULL,
	`pdf_url` text,
	`generated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assessment_id`) REFERENCES `risk_assessments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `risk_reports_user_id_idx` ON `risk_reports` (`user_id`);--> statement-breakpoint
CREATE INDEX `risk_reports_assessment_id_idx` ON `risk_reports` (`assessment_id`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`email_notifications` integer DEFAULT true NOT NULL,
	`theme_preference` text DEFAULT 'system' NOT NULL,
	`risk_threshold` real DEFAULT 700 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_id_unique` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_settings_user_id_idx` ON `user_settings` (`user_id`);