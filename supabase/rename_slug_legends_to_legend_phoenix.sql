-- One-time rename for DBs that already had machines.slug / guides.slug = 'legends-of-the-phoenix'.
-- Run in the Supabase SQL editor, then deploy the repo and `npm run slots:sync -- --slug=legend-of-the-phoenix`
-- so content matches. If you skip this, sync inserts the new slug while the old row remains.

UPDATE machines
SET slug = 'legend-of-the-phoenix', updated_at = now()
WHERE slug = 'legends-of-the-phoenix';

UPDATE guides
SET slug = 'legend-of-the-phoenix', updated_at = now()
WHERE slug = 'legends-of-the-phoenix';

UPDATE guides
SET
  related_machine_slugs = array_replace(
    related_machine_slugs,
    'legends-of-the-phoenix',
    'legend-of-the-phoenix'
  ),
  updated_at = now()
WHERE related_machine_slugs @> ARRAY['legends-of-the-phoenix']::text[];
