-- Prepared only. NOT executed by runtime or this mission.
-- Before execution: exact isolated Preview target, verified recoverable backup,
-- explicit Preview-only DDL authorization, existing-row compatibility checks.
-- Install only an absent constraint; never drop/replace an existing constraint.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
do $$ begin
  if not exists (select 1 from pg_catalog.pg_constraint
      where conrelid = 'noxia_durable.doc_working_revision'::regclass
        and conname = 'doc_working_revision_native_binding_required') then
    alter table noxia_durable.doc_working_revision add constraint
      doc_working_revision_native_binding_required check (
        jsonb_typeof(revision) = 'object' and coalesce(
          revision->>'revisionId' = revision_id
          and (revision->>'saveSequence')::bigint = save_sequence
          and revision->>'status' = status
          and revision->>'baseGenerationId' = base_generation_id
          and revision->>'baseGenerationBodyDigest' = base_body_sha256
          and revision->>'logicalDocumentRef' = logical_document_ref, false)) not valid;
    alter table noxia_durable.doc_working_revision validate constraint doc_working_revision_native_binding_required;
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint
      where conrelid = 'noxia_durable.doc_studio_finalization_intent'::regclass
        and conname = 'doc_studio_intent_native_binding_required') then
    alter table noxia_durable.doc_studio_finalization_intent add constraint
      doc_studio_intent_native_binding_required check (
        jsonb_typeof(record_text::jsonb) = 'object' and coalesce(
          (record_text::jsonb)->>'finalizationIntentId' = intent_id
          and (record_text::jsonb)->>'intentDigest' = intent_digest
          and ((record_text::jsonb)->>'sequence')::bigint = sequence, false)) not valid;
    alter table noxia_durable.doc_studio_finalization_intent validate constraint doc_studio_intent_native_binding_required;
  end if;
end $$;
commit;
