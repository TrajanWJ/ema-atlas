-- mart_engagements: engagement + talent + client joined with GMV.
-- GMV = (hours_approved + hours_pending) * hourly_rate.
with eng as (
    select * from {{ ref('stg_engagements') }}
),
tal as (
    select * from {{ ref('stg_talent') }}
),
job as (
    select * from {{ ref('stg_jobs') }}
)
select
    eng.engagement_id,
    eng.engagement_sk,
    eng.status                                              as engagement_status,
    eng.started_date,
    eng.client_name,
    eng.job_id,
    job.title                                               as job_title,
    job.category                                            as job_category,
    job.industry                                            as job_industry,
    eng.talent_id,
    tal.talent_name,
    tal.city                                                as talent_city,
    tal.timezone                                            as talent_timezone,
    tal.years_exp,
    eng.hourly_rate,
    eng.hours_this_week,
    eng.hours_approved,
    eng.hours_pending,
    (eng.hours_approved + eng.hours_pending) * eng.hourly_rate      as engagement_gmv,
    eng.hours_approved * eng.hourly_rate                            as engagement_gmv_approved
from eng
left join tal on tal.talent_id = eng.talent_id
left join job on job.job_id = eng.job_id
