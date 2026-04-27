-- mart_match_funnel: jobs by status, average time to first match, job→engagement conversion.
-- Time-to-first-match approximated as days between job.posted_date and MIN(engagement.started_date)
-- where the engagement points back at the job.
with jobs as (
    select * from {{ ref('stg_jobs') }}
),
engagements as (
    select * from {{ ref('stg_engagements') }}
),
first_eng as (
    select
        job_id,
        min(started_date)                                   as first_engagement_date,
        count(*)                                            as engagement_count
    from engagements
    group by job_id
),
job_detail as (
    select
        j.job_id,
        j.title,
        j.category,
        j.industry,
        j.status,
        j.posted_date,
        j.match_count,
        fe.first_engagement_date,
        coalesce(fe.engagement_count, 0)                    as engagement_count,
        case
            when j.posted_date is not null and fe.first_engagement_date is not null
            then date_diff('day', j.posted_date, fe.first_engagement_date)
            else null
        end                                                 as days_to_first_match
    from jobs j
    left join first_eng fe on fe.job_id = j.job_id
),
summary as (
    select
        status,
        count(*)                                            as job_count,
        sum(case when engagement_count > 0 then 1 else 0 end)  as jobs_with_engagement,
        avg(days_to_first_match)                            as avg_days_to_first_match,
        sum(match_count)                                    as total_matches_offered
    from job_detail
    group by status
)
select
    status,
    job_count,
    jobs_with_engagement,
    case when job_count > 0
        then cast(jobs_with_engagement as double) / cast(job_count as double)
        else 0
    end                                                     as conversion_rate,
    avg_days_to_first_match,
    total_matches_offered
from summary
