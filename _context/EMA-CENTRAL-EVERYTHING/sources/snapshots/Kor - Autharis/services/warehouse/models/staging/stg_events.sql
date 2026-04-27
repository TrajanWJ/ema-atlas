-- stg_events: normalize synthesized event stream (from scripts/export_events.py,
-- which simulates the F8 publish stream).
with src as (
    select * from {{ ref('seed_events') }}
)
select
    md5(cast(event_id as varchar))                          as event_sk,
    cast(event_id as varchar)                               as event_id,
    cast(channel as varchar)                                as channel,
    cast(event_type as varchar)                             as event_type,
    cast(subject_id as varchar)                             as subject_id,
    cast(actor_id as varchar)                               as actor_id,
    try_cast(occurred_at as timestamp)                      as occurred_at,
    cast(payload as varchar)                                as payload_json
from src
