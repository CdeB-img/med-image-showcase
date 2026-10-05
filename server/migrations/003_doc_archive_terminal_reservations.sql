-- A known terminal non-result releases storage capacity, never provider money.
-- Preserve the DOC intent; no delete, expiry or automatic retry.
alter table noxia_durable.doc_generation drop constraint if exists doc_generation_state_check;
alter table noxia_durable.doc_generation add constraint doc_generation_state_check
  check (state in ('RESERVED', 'COMMITTED', 'REJECTED'));
alter table noxia_durable.doc_generation drop constraint if exists doc_generation_check;
alter table noxia_durable.doc_generation add constraint doc_generation_check
  check ((state in ('RESERVED', 'REJECTED') and metadata is null and generation_id is null)
    or (state = 'COMMITTED' and metadata is not null and generation_id is not null
      and body_sha256 is not null and body_bytes > 0));
