-- stg_engagements: normalize engagement seed.
with src as (
    select * from {{ ref('seed_engagements') }}
)
select
    md5(cast(id as varchar))                                as engagement_sk,
    cast(id as varchar)                                     as engagement_id,
    cast(job_id as varchar)                                 as job_id,
    cast(job_title as varchar)                              as job_title,
    cast(talent_id as varchar)                              as talent_id,
    cast(talent_name as varchar)                            as talent_name,
    cast(client as varchar)                                 as client_name,
    cast(rate as double)                                    as hourly_rate,
    cast(status as varchar)                                 as status,
    try_cast(started as date)                               as started_date,
    cast(hours_this_week as double)                         as hours_this_week,
    cast(hours_approved as double)                          as hours_approved,
    cast(hours_pending as double)                           as hours_pending
from src
