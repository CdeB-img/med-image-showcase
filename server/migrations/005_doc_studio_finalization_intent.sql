-- DOC-owned frozen user operation and append-only resolution evidence.
-- Not a provider operation, Project version, or document generation.
create table if not exists noxia_durable.doc_studio_finalization_intent (
  session_key_hash text not null,
  project_id text not null,
  intent_id text not null,
  sequence bigint not null check (sequence > 0),
  revision_id text not null,
  save_sequence bigint not null,
  intent_digest text not null,
  record_text text not null,
  record_sha256 text not null check (record_sha256 ~ '^[a-f0-9]{64}$'),
  primary key (session_key_hash, project_id, intent_id, sequence),
  foreign key (session_key_hash, project_id, revision_id, save_sequence)
    references noxia_durable.doc_working_revision (session_key_hash, project_id, revision_id, save_sequence),
  check ((record_text::jsonb)->>'finalizationIntentId' = intent_id
    and (record_text::jsonb)->>'intentDigest' = intent_digest
    and ((record_text::jsonb)->>'sequence')::bigint = sequence)
);
create index if not exists doc_studio_intent_save_lookup
  on noxia_durable.doc_studio_finalization_intent (session_key_hash, project_id, revision_id, save_sequence, intent_id);
create or replace function noxia_durable.reject_doc_studio_intent_change()
returns trigger language plpgsql as $$
begin
  raise exception 'DOC_STUDIO_INTENT_EVIDENCE_IMMUTABLE';
end;
$$;
drop trigger if exists doc_studio_intent_immutable on noxia_durable.doc_studio_finalization_intent;
create trigger doc_studio_intent_immutable before update or delete
  on noxia_durable.doc_studio_finalization_intent for each row
  execute function noxia_durable.reject_doc_studio_intent_change();
