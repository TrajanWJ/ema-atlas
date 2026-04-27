-- stg_jobs: normalize job request seed.
with src as (
    select * from {{ ref('seed_jobs') }}
)
select
    md5(cast(id as varchar))                                as job_sk,
    cast(id as varchar)                                     as job_id,
    cast(title as varchar)                                  as title,
    cast(category as varchar)                               as category,
    cast(client as varchar)                                 as client_name,
    cast(hours_per_week as integer)                         as hours_per_week,
    cast(duration as varchar)                               as duration,
    cast(timezone as varchar)                               as timezone,
    cast(budget_low as double)                              as budget_low,
    cast(budget_high as double)                             as budget_high,
    string_split(cast(skills as varchar), '|')              as skills,
    cast(industry as varchar)                               as industry,
    cast(status as varchar)                                 as status,
    try_cast(posted as date)                                as posted_date,
    cast(matches as integer)                                as match_count
from src
