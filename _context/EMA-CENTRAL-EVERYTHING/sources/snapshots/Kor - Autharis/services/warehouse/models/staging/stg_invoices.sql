-- stg_invoices: normalize invoice seed.
with src as (
    select * from {{ ref('seed_invoices') }}
)
select
    md5(cast(id as varchar))                                as invoice_sk,
    cast(id as varchar)                                     as invoice_id,
    cast(engagement_id as varchar)                          as engagement_id,
    cast(client as varchar)                                 as client_name,
    try_cast(period_start as date)                          as period_start,
    try_cast(period_end as date)                            as period_end,
    cast(hours as double)                                   as hours,
    cast(rate as double)                                    as hourly_rate,
    cast(subtotal as double)                                as subtotal,
    cast(fee as double)                                     as platform_fee,
    cast(total as double)                                   as total_amount,
    cast(status as varchar)                                 as status,
    try_cast(issued_date as date)                           as issued_date
from src
