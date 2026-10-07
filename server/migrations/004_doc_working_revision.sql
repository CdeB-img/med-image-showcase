-- DOC-local editorial working state, never a generation or Project snapshot.
-- Append-only confirmed saves retain provenance and allow logical abandonment.
create table if not exists noxia_durable.doc_working_revision (
  session_key_hash text not null,
  project_id text not null,
  revision_id text not null,
  save_sequence bigint not null check (save_sequence > 0),
  base_generation_id text not null,
  base_body_sha256 text not null check (base_body_sha256 ~ '^[a-f0-9]{64}$'),
  logical_document_ref text not null,
  status text not null check (status in ('ACTIVE', 'ABANDONED')),
  revision jsonb not null,
  primary key (session_key_hash, project_id, revision_id, save_sequence),
  foreign key (session_key_hash, project_id, base_generation_id)
    references noxia_durable.doc_generation (session_key_hash, project_id, generation_id),
  check (revision->>'revisionId' = revision_id
    and (revision->>'saveSequence')::bigint = save_sequence
    and revision->>'status' = status
    and revision->>'baseGenerationId' = base_generation_id
    and revision->>'baseGenerationBodyDigest' = base_body_sha256
    and revision->>'logicalDocumentRef' = logical_document_ref)
);
create or replace function noxia_durable.reject_doc_working_revision_change()
returns trigger language plpgsql as $$
begin
  raise exception 'DOC_REVISION_SAVE_IMMUTABLE';
end;
$$;
drop trigger if exists doc_working_revision_immutable on noxia_durable.doc_working_revision;
create trigger doc_working_revision_immutable before update or delete
  on noxia_durable.doc_working_revision for each row
  execute function noxia_durable.reject_doc_working_revision_change();
