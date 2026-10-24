-- Bring existing website enquiries into the opportunities pipeline.
-- Non-destructive: the enquiries table is left untouched, and re-running inserts nothing twice.
INSERT INTO `opportunities` (`id`, `ref`, `stage`, `name`, `email`, `company_name`, `website`, `problem`, `context`, `source`, `idempotency_key`, `legacy_enquiry_id`, `created_at`, `updated_at`)
SELECT
  'opp_' || substr(`id`, 5),
  lower(hex(randomblob(9))),
  CASE `status` WHEN 'new' THEN 'new' WHEN 'contacted' THEN 'reviewing' ELSE 'archived' END,
  `name`, `email`, `company`, `website`, `message`, '{}', 'contact_form',
  'legacy:' || `id`, `id`, `created_at`, `created_at`
FROM `enquiries`
WHERE `id` NOT IN (SELECT `legacy_enquiry_id` FROM `opportunities` WHERE `legacy_enquiry_id` IS NOT NULL);
