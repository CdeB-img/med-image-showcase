create schema if not exists noxia_durable;

create table if not exists noxia_durable.public_guard_session (
  session_key_hash text primary key,
  client_key_hash text not null,
  admission_count integer not null default 0 check (admission_count >= 0),
  quota_updated_at timestamptz not null,
  measured_cost_usd numeric(18, 10) not null default 0 check (measured_cost_usd >= 0),
  committed_cost_upper_bound_usd numeric(18, 10) not null default 0 check (committed_cost_upper_bound_usd >= measured_cost_usd),
  provider_gate_closed boolean not null default false,
  version bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists noxia_durable.public_bridge_admission (
  admission_key text primary key,
  session_key_hash text not null references noxia_durable.public_guard_session(session_key_hash),
  client_request_id_hash text not null,
  request_digest text not null,
  state text not null check (state in ('COUNTING', 'ACTIVE', 'COMPLETED')),
  response_status integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists public_bridge_admission_session_idx
  on noxia_durable.public_bridge_admission(session_key_hash, created_at);

create table if not exists noxia_durable.public_provider_operation (
  operation_key text primary key,
  admission_key text not null references noxia_durable.public_bridge_admission(admission_key),
  session_key_hash text not null references noxia_durable.public_guard_session(session_key_hash),
  operation_index integer not null check (operation_index >= 0),
  purpose text,
  endpoint_digest text not null,
  payload_digest text not null,
  configuration_digest text not null,
  state text not null check (state in (
    'COUNT_PENDING', 'COUNT_DISPATCHED', 'COUNT_COMPLETED', 'COUNT_FAILED', 'COUNT_UNKNOWN_AFTER_DISPATCH',
    'RESERVED', 'DISPATCHED', 'COMPLETED_RECEIVED', 'VALIDATED', 'CONSUMED', 'UNKNOWN_AFTER_DISPATCH',
    'INPUT_TOKEN_DIVERGENCE', 'QUALIFICATION_INVALID'
  )),
  reserved_upper_bound_usd numeric(18, 10) not null check (reserved_upper_bound_usd >= 0),
  measured_cost_usd numeric(18, 10),
  committed_cost_upper_bound_usd numeric(18, 10),
  provider_http_status integer,
  provider_response_body text,
  provider_response_headers jsonb,
  provider_response_digest text,
  dispatched_at timestamptz,
  dispatch_lease_expires_at timestamptz,
  completed_at timestamptz,
  settled_at timestamptz,
  count_payload_digest text,
  counted_input_tokens integer check (counted_input_tokens > 0),
  count_model text,
  count_pricing_snapshot_date text,
  count_http_status integer,
  count_response_digest text,
  count_failure_code text,
  count_dispatched_at timestamptz,
  count_lease_expires_at timestamptz,
  count_completed_at timestamptz,
  count_provider text,
  generation_provider text,
  generation_model text,
  count_qualification_ref text,
  qualification_failure_code text,
  post_usage_input_tokens integer,
  input_token_delta integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (admission_key, operation_index)
);

create index if not exists public_provider_operation_session_idx
  on noxia_durable.public_provider_operation(session_key_hash, created_at);

alter table noxia_durable.public_provider_operation
  add column if not exists dispatch_lease_expires_at timestamptz;

alter table noxia_durable.public_bridge_admission
  drop constraint if exists public_bridge_admission_state_check;
alter table noxia_durable.public_bridge_admission
  add constraint public_bridge_admission_state_check
  check (state in ('COUNTING', 'ACTIVE', 'COMPLETED'));

alter table noxia_durable.public_provider_operation
  drop constraint if exists public_provider_operation_state_check;
alter table noxia_durable.public_provider_operation
  add constraint public_provider_operation_state_check
  check (state in (
    'COUNT_PENDING', 'COUNT_DISPATCHED', 'COUNT_COMPLETED', 'COUNT_FAILED', 'COUNT_UNKNOWN_AFTER_DISPATCH',
    'RESERVED', 'DISPATCHED', 'COMPLETED_RECEIVED', 'VALIDATED', 'CONSUMED', 'UNKNOWN_AFTER_DISPATCH',
    'INPUT_TOKEN_DIVERGENCE', 'QUALIFICATION_INVALID'
  ));
alter table noxia_durable.public_provider_operation
  drop constraint if exists public_provider_operation_reserved_upper_bound_usd_check;
alter table noxia_durable.public_provider_operation
  add constraint public_provider_operation_reserved_upper_bound_usd_check
  check (reserved_upper_bound_usd >= 0);
alter table noxia_durable.public_provider_operation
  add column if not exists count_payload_digest text,
  add column if not exists counted_input_tokens integer,
  add column if not exists count_model text,
  add column if not exists count_pricing_snapshot_date text,
  add column if not exists count_http_status integer,
  add column if not exists count_response_digest text,
  add column if not exists count_failure_code text,
  add column if not exists count_dispatched_at timestamptz,
  add column if not exists count_lease_expires_at timestamptz,
  add column if not exists count_completed_at timestamptz,
  add column if not exists count_provider text,
  add column if not exists generation_provider text,
  add column if not exists generation_model text,
  add column if not exists count_qualification_ref text,
  add column if not exists qualification_failure_code text,
  add column if not exists post_usage_input_tokens integer,
  add column if not exists input_token_delta integer;

create table if not exists noxia_durable.public_provider_equivalence_gate (
  generation_endpoint_digest text not null,
  generation_model text not null,
  count_qualification_ref text not null,
  state text not null check (state in ('OPEN', 'CLOSED')),
  anomaly_operation_key text,
  invalidated_at timestamptz,
  primary key (generation_endpoint_digest, generation_model)
);
alter table noxia_durable.public_provider_equivalence_gate
  add column if not exists count_qualification_ref text;

create table if not exists noxia_durable.public_rate_bucket (
  client_key_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default now()
);

comment on schema noxia_durable is
  'Technical operation guard only. No patient, clinical, provider-secret, prompt, or request content.';
