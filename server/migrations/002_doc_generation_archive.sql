create schema if not exists noxia_durable;
create table if not exists noxia_durable.doc_generation (
  session_key_hash text not null,
  project_id text not null,
  request_id text not null,
  request_sha256 text not null,
  generated_at text not null,
  reserved_bytes bigint not null check (reserved_bytes > 0),
  state text not null check (state in ('RESERVED', 'COMMITTED')),
  ordinal bigint not null check (ordinal > 0),
  generation_id text,
  body_sha256 text,
  body_bytes bigint,
  metadata jsonb,
  primary key (session_key_hash, project_id, request_id),
  unique (session_key_hash, project_id, ordinal),
  unique (session_key_hash, project_id, generation_id),
  check ((state = 'RESERVED' and metadata is null and generation_id is null)
    or (state = 'COMMITTED' and metadata is not null and generation_id is not null
      and body_sha256 is not null and body_bytes > 0))
);
create index if not exists doc_generation_history_idx
  on noxia_durable.doc_generation (session_key_hash, project_id, ordinal desc)
  where state = 'COMMITTED';
create table if not exists noxia_durable.doc_generation_body (
  session_key_hash text not null,
  project_id text not null,
  request_id text not null,
  native_body_text text not null,
  body_sha256 text not null,
  primary key (session_key_hash, project_id, request_id),
  foreign key (session_key_hash, project_id, request_id)
    references noxia_durable.doc_generation (session_key_hash, project_id, request_id)
);
-- Immutability is enforced in the archive API and at the database boundary.
-- No delete cascade, TTL or pruning policy is introduced by this migration.
create or replace function noxia_durable.reject_doc_archive_body_change()
returns trigger language plpgsql as $$
begin
  raise exception 'DOC_ARCHIVE_IMMUTABLE';
end;
$$;
drop trigger if exists doc_archive_body_immutable on noxia_durable.doc_generation_body;
create trigger doc_archive_body_immutable before update or delete
  on noxia_durable.doc_generation_body for each row
  execute function noxia_durable.reject_doc_archive_body_change();
create or replace function noxia_durable.reject_doc_archive_metadata_change()
returns trigger language plpgsql as $$
begin
  if old.state = 'COMMITTED' then raise exception 'DOC_ARCHIVE_IMMUTABLE'; end if;
  return new;
end;
$$;
drop trigger if exists doc_archive_metadata_immutable on noxia_durable.doc_generation;
create trigger doc_archive_metadata_immutable before update or delete
  on noxia_durable.doc_generation for each row
  execute function noxia_durable.reject_doc_archive_metadata_change();
