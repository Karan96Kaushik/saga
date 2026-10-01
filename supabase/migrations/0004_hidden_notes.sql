-- Hidden notes stay out of the usual lists. Hiding does not write a version.

alter table public.notes
  add column if not exists is_hidden boolean not null default false;

comment on column public.notes.is_hidden is
  'Hidden notes stay out of the usual lists. They are not versioned separately.';
