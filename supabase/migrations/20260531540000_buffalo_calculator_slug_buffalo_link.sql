-- Rename Buffalo Link calculator_slug from legacy `buffalo` → `buffalo-link` (room for other buffalo titles).

update public.machines
set calculator_slug = 'buffalo-link'
where calculator_slug = 'buffalo';

update public.play_log_game_templates
set
  calculator_slug = 'buffalo-link',
  machine_slug = coalesce(nullif(trim(machine_slug), ''), 'buffalo-link')
where slug = 'buffalo-link'
  and is_system = true;

update public.play_log_game_templates
set calculator_slug = 'buffalo-link'
where calculator_slug = 'buffalo';

update public.content_access_gates
set content_slug = 'buffalo-link'
where content_kind = 'calculator'
  and content_slug = 'buffalo';
