-- stg_talent: normalize talent seed into typed columns + surrogate key.
with src as (
    select * from {{ ref('seed_talent') }}
)
select
    md5(cast(id as varchar))                                as talent_sk,
    cast(id as varchar)                                     as talent_id,
    cast(name as varchar)                                   as talent_name,
    cast(title as varchar)                                  as title,
    cast(city as varchar)                                   as city,
    cast(timezone as varchar)                               as timezone,
    cast(rate as double)                                    as hourly_rate,
    cast(availability_hours as integer)                     as availability_hours,
    string_split(cast(categories as varchar), '|')          as categories,
    string_split(cast(skills as varchar), '|')              as skills,
    string_split(cast(industries as varchar), '|')          as industries,
    cast(status as varchar)                                 as status,
    cast(score as integer)                                  as match_score,
    cast(years_exp as integer)                              as years_exp
from src
