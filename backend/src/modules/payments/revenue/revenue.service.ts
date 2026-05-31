import type { Knex as KnexType } from 'knex';
import { PlatformRevenueLedger } from './revenue.model';
import type { RevenueDashboardQuery, RevenueJobsQuery } from './revenue.schema';

const JOBS_PAGE_SIZE = 20;

export interface PeriodRevenue {
  date: string;
  total_paisa: number;
}

export interface RuleBreakdown {
  rule_id: string;
  label: string;
  scope: string;
  rate: string;
  total_paisa: number;
}

export interface CategoryRevenue {
  category_id: string;
  name: string;
  slug: string;
  total_paisa: number;
}

export interface RevenueDashboard {
  total_revenue_paisa: number;
  revenue_by_period: PeriodRevenue[];
  breakdown_by_rule: RuleBreakdown[];
  top_categories: CategoryRevenue[];
}

export interface JobRevenueRow {
  ledger_id: string;
  payment_id: string;
  job_id: string;
  revenue_paisa: number;
  payment_amount_paisa: number;
  commission_rate: string;
  method: string;
  rule_label: string;
  rule_scope: string;
  category_name: string;
  created_at: string;
  verified_at: string | null;
}

async function getDashboard(query: RevenueDashboardQuery): Promise<RevenueDashboard> {
  const knex = PlatformRevenueLedger.knex();
  const { period = 'monthly', from, to } = query;

  const dateFilter = (qb: KnexType.QueryBuilder): void => {
    if (from) qb.where('prl.created_at', '>=', from);
    if (to) qb.where('prl.created_at', '<=', to);
  };

  // 1. All-time (or filtered) total
  const [totalRow] = await knex('platform_revenue_ledger as prl')
    .sum('amount_paisa as total')
    .modify(dateFilter);
  const total_revenue_paisa = Number(totalRow?.total ?? 0);

  // 2. Revenue grouped by day or month — period is validated by Zod to 'daily'|'monthly'
  const truncUnit = period === 'daily' ? 'day' : 'month';
  const dateFmt = period === 'daily' ? 'YYYY-MM-DD' : 'YYYY-MM';
  const truncExpr = `date_trunc('${truncUnit}', prl.created_at)`;

  const periodRows = await knex('platform_revenue_ledger as prl')
    .select(knex.raw(`to_char(${truncExpr}, '${dateFmt}') as date`))
    .sum('prl.amount_paisa as total_paisa')
    .modify(dateFilter)
    .groupByRaw(truncExpr)
    .orderByRaw(truncExpr);

  const revenue_by_period: PeriodRevenue[] = (periodRows as Array<{ date: string; total_paisa: string }>).map((r) => ({
    date: r.date,
    total_paisa: Number(r.total_paisa),
  }));

  // 3. Total per commission rule
  const ruleRows = await knex('platform_revenue_ledger as prl')
    .join('commission_rules as cr', 'cr.id', 'prl.commission_rule_id')
    .select('cr.id as rule_id', 'cr.label', 'cr.scope', 'cr.rate')
    .sum('prl.amount_paisa as total_paisa')
    .modify(dateFilter)
    .groupBy('cr.id', 'cr.label', 'cr.scope', 'cr.rate')
    .orderBy('total_paisa', 'desc');

  const breakdown_by_rule: RuleBreakdown[] = ruleRows.map((r) => ({
    rule_id: r.rule_id as string,
    label: r.label as string,
    scope: r.scope as string,
    rate: r.rate as string,
    total_paisa: Number(r.total_paisa),
  }));

  // 4. Top 5 categories by revenue
  const categoryRows = await knex('platform_revenue_ledger as prl')
    .join('payments as p', 'p.id', 'prl.payment_id')
    .join('jobs as j', 'j.id', 'p.job_id')
    .join('categories as c', 'c.id', 'j.category_id')
    .select('c.id as category_id', 'c.name', 'c.slug')
    .sum('prl.amount_paisa as total_paisa')
    .modify(dateFilter)
    .groupBy('c.id', 'c.name', 'c.slug')
    .orderBy('total_paisa', 'desc')
    .limit(5);

  const top_categories: CategoryRevenue[] = categoryRows.map((r) => ({
    category_id: r.category_id as string,
    name: r.name as string,
    slug: r.slug as string,
    total_paisa: Number(r.total_paisa),
  }));

  return { total_revenue_paisa, revenue_by_period, breakdown_by_rule, top_categories };
}

async function getJobsDetail(query: RevenueJobsQuery): Promise<{
  items: JobRevenueRow[];
  nextCursor: string | null;
}> {
  const knex = PlatformRevenueLedger.knex();
  const { cursor, limit } = query;
  const pageSize = Math.min(limit ?? JOBS_PAGE_SIZE, 100);

  let qb = knex('platform_revenue_ledger as prl')
    .join('payments as p', 'p.id', 'prl.payment_id')
    .join('jobs as j', 'j.id', 'p.job_id')
    .join('commission_rules as cr', 'cr.id', 'prl.commission_rule_id')
    .join('categories as c', 'c.id', 'j.category_id')
    .select(
      'prl.id as ledger_id',
      'p.id as payment_id',
      'j.id as job_id',
      'prl.amount_paisa as revenue_paisa',
      'p.amount_paisa as payment_amount_paisa',
      'p.commission_rate',
      'p.method',
      'cr.label as rule_label',
      'cr.scope as rule_scope',
      'c.name as category_name',
      'prl.created_at',
      'p.verified_at'
    )
    .orderBy('prl.created_at', 'desc')
    .limit(pageSize + 1);

  if (cursor) {
    qb = qb.where('prl.created_at', '<', cursor);
  }

  const rows = await qb;
  const hasMore = rows.length > pageSize;
  const items = hasMore ? rows.slice(0, pageSize) : rows;
  const lastRow = items[items.length - 1];
  const nextCursor = hasMore && lastRow
    ? new Date(lastRow.created_at as string | Date).toISOString()
    : null;

  return {
    items: items.map((r) => ({
      ledger_id: r.ledger_id as string,
      payment_id: r.payment_id as string,
      job_id: r.job_id as string,
      revenue_paisa: Number(r.revenue_paisa),
      payment_amount_paisa: Number(r.payment_amount_paisa),
      commission_rate: r.commission_rate as string,
      method: r.method as string,
      rule_label: r.rule_label as string,
      rule_scope: r.rule_scope as string,
      category_name: r.category_name as string,
      created_at: new Date(r.created_at as string | Date).toISOString(),
      verified_at: r.verified_at ? new Date(r.verified_at as string | Date).toISOString() : null,
    })),
    nextCursor,
  };
}

export const RevenueService = { getDashboard, getJobsDetail };
