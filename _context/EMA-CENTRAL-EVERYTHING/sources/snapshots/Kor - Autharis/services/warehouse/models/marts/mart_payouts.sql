-- mart_payouts: invoice + timesheet roll-up per talent, with platform fee and net payout.
-- Net payout to talent = subtotal - platform_fee (platform_fee is already stored on invoice).
with invoices as (
    select * from {{ ref('stg_invoices') }}
),
engagements as (
    select * from {{ ref('stg_engagements') }}
),
timesheets as (
    select * from {{ ref('stg_timesheets') }}
),
invoice_by_eng as (
    select
        engagement_id,
        count(*)                                            as invoice_count,
        sum(hours)                                          as invoiced_hours,
        sum(subtotal)                                       as invoiced_subtotal,
        sum(platform_fee)                                   as invoiced_fee,
        sum(total_amount)                                   as invoiced_total,
        sum(case when status = 'Paid' then total_amount else 0 end) as paid_total
    from invoices
    group by engagement_id
),
ts_by_eng as (
    select
        engagement_id,
        sum(case when status in ('Approved','Submitted') then hours else 0 end)         as billable_hours,
        sum(case when status = 'Approved' then hours * hourly_rate else 0 end)          as approved_gross
    from timesheets
    group by engagement_id
)
select
    e.talent_id,
    e.talent_name,
    e.engagement_id,
    e.client_name,
    e.hourly_rate,
    coalesce(i.invoice_count, 0)                            as invoice_count,
    coalesce(i.invoiced_hours, 0)                           as invoiced_hours,
    coalesce(i.invoiced_subtotal, 0)                        as gross_revenue,
    coalesce(i.invoiced_fee, 0)                             as platform_fee,
    coalesce(i.invoiced_subtotal, 0) - coalesce(i.invoiced_fee, 0)  as net_payout,
    coalesce(i.paid_total, 0)                               as paid_total,
    coalesce(t.billable_hours, 0)                           as billable_hours,
    coalesce(t.approved_gross, 0)                           as approved_gross
from engagements e
left join invoice_by_eng i on i.engagement_id = e.engagement_id
left join ts_by_eng      t on t.engagement_id = e.engagement_id
