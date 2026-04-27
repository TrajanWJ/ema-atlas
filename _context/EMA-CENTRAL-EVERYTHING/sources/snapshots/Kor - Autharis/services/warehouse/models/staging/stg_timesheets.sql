-- stg_timesheets: normalize timesheet seed.
with src as (
    select * from {{ ref('seed_timesheets') }}
)
select
    md5(cast(id as varchar))                                as timesheet_sk,
    cast(id as varchar)                                     as timesheet_id,
    cast(engagement_id as varchar)                          as engagement_id,
    cast(engagement_title as varchar)                       as engagement_title,
    cast(talent_name as varchar)                            as talent_name,
    cast(client as varchar)                                 as client_name,
    try_cast(week_of as date)                               as week_of,
    cast(status as varchar)                                 as status,
    cast(hours as double)                                   as hours,
    cast(rate as double)                                    as hourly_rate,
    cast(hours as double) * cast(rate as double)            as gross_amount,
    try_cast(submitted as timestamp)                        as submitted_at,
    try_cast(approved as timestamp)                         as approved_at
from src
