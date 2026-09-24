CREATE TABLE `launch_offer` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`checkout_id` text,
	`checkout_url` text,
	`checkout_expires_at` integer
);
