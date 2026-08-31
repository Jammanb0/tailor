-- routed 운영 관찰용 계측 표.
--
-- 기준 문서: docs/experiments/data/2026-08-31-routed-operations/PRE-REGISTRATION.md
-- 이 파일은 그 문서의 스키마와 판정 정의를 SQL로 옮긴 것이다. 둘이 어긋나면
-- 사전등록 문서가 원본이다.
--
-- Supabase 대시보드의 SQL Editor에 붙여 한 번 실행한다. Supabase CLI 마이그레이션을
-- 쓰지 않으므로 이 파일이 스키마의 유일한 기록이다.
--
-- 저장하지 않는 것: 사용자 원문, 생성 결과 전문, 파일명, 오류 message,
-- 묶음·패턴 id, IP, User-Agent, 사용자 식별자. 열이 없어야 실수로도 안 들어간다.

create table if not exists public.generations (
  operation_id            uuid        primary key,

  -- 요청 시작 시각. 서버가 만들어 pending insert와 오류 로그에 같은 값을 쓴다.
  -- default now()를 쓰지 않는다 — 저장 지연만큼 로그와 어긋나면 대조가 안 맞는다.
  started_at              timestamptz not null,

  deployment_id           text,
  is_smoke                boolean     not null default false,

  kind                    text        not null,
  configured_mode         text        not null,
  -- Sonnet을 부르지 않았으면 null이다. 전달한 코퍼스가 없는데 full이라고 적으면
  -- 전환율 질의가 중단된 요청까지 끌어온다.
  delivered_mode          text,
  generation_attempted    boolean     not null default false,

  status                  text        not null default 'pending',
  error_code              text,

  selection_status        text,
  selection_fallback      boolean,
  fallback_reason_ids     text[],
  ambiguity_ids           text[],
  selection_error_stage   text,
  selection_error_category text,
  selection_ms            integer,

  -- usage 열 이름은 telemetry.ts의 USAGE_LOG_FIELDS를 그대로 따른다.
  -- 2026-08-28 실험 자료가 같은 이름이라, 바꾸면 옛 자료와 함께 집계할 수 없다.
  selection_usage_input_tokens                 integer,
  selection_usage_output_tokens                integer,
  selection_usage_cache_creation_input_tokens  integer,
  selection_usage_cache_read_input_tokens      integer,

  generation_ms           integer,
  generation_stop_reason  text,
  generation_usage_input_tokens                integer,
  generation_usage_output_tokens               integer,
  generation_usage_cache_creation_input_tokens integer,
  generation_usage_cache_read_input_tokens     integer,

  delivered_pattern_count integer,
  injected_bytes          integer,
  total_ms                integer,

  -- ── 값 제한 ──────────────────────────────────────────────────────
  --
  -- 사전등록이 「고정 집합」이라고 부른 값은 전부 여기서 막는다. 서버의 허용
  -- 목록만 믿으면 배선 실수 하나로 이상한 값이 조용히 쌓이고, 100건을 다 센
  -- 다음에야 발견한다. 목록의 원본은 코드다.

  constraint generations_kind_check
    check (kind in ('create', 'refine')),
  constraint generations_configured_mode_check
    check (configured_mode in ('full', 'routed')),
  constraint generations_delivered_mode_check
    check (delivered_mode is null or delivered_mode in ('full', 'routed')),
  constraint generations_status_check
    check (status in ('pending', 'success', 'needs_more_info', 'error')),

  -- src/lib/generation-errors.ts · GENERATION_ERROR_CODES
  constraint generations_error_code_check
    check (error_code is null or error_code in (
      'usage_exhausted', 'billing_unavailable', 'authentication_unavailable',
      'rate_limited', 'upstream_unavailable', 'invalid_upstream_request',
      'parse_failure', 'input_too_large', 'invalid_request',
      'missing_required_answers'
    )),

  -- routing.ts · SelectionDecision["status"]
  constraint generations_selection_status_check
    check (selection_status is null
           or selection_status in ('success', 'ambiguous', 'failure')),

  -- telemetry.ts · ERROR_STAGES 중 선택 경로의 둘
  constraint generations_selection_error_stage_check
    check (selection_error_stage is null
           or selection_error_stage in ('selection', 'selection-processing')),

  -- telemetry.ts · ERROR_LOG_CATEGORIES
  --   = upstream-error.ts UPSTREAM_ERROR_CATEGORIES + SELECTION_PROCESSING_CATEGORY
  constraint generations_selection_error_category_check
    check (selection_error_category is null or selection_error_category in (
      'usage_exhausted', 'billing_unavailable', 'authentication_unavailable',
      'rate_limited', 'upstream_unavailable', 'invalid_upstream_request',
      'selection_processing_error'
    )),

  -- telemetry.ts · FALLBACK_REASON_IDS / AMBIGUITY_IDS
  -- <@ 는 「왼쪽 배열의 모든 원소가 오른쪽에 있는가」다. 빈 배열도 통과한다.
  constraint generations_fallback_reason_ids_check
    check (fallback_reason_ids is null
           or fallback_reason_ids <@ array['F1','F2','F3','F4','F5','F6']::text[]),
  constraint generations_ambiguity_ids_check
    check (ambiguity_ids is null or ambiguity_ids <@ array['F7']::text[]),

  -- 사전등록의 불변식. 값이 어긋난 행이 들어오는 것을 DB가 막는다.
  constraint generations_attempted_matches_delivered
    check (generation_attempted = (delivered_mode is not null))
);

-- 첫 100건을 순서대로 자르고, p̂의 5분 간격을 재는 데 쓴다.
-- operation_id를 함께 넣는 이유는 아래 뷰의 정렬과 같은 순서를 쓰기 위해서다.
create index if not exists generations_started_at_idx
  on public.generations (started_at, operation_id);

-- stale pending 조회 전용. 표가 커져도 이 질의는 pending 행만 훑는다.
create index if not exists generations_pending_idx
  on public.generations (started_at)
  where status = 'pending';

-- ── 접근 차단 ────────────────────────────────────────────────────────
--
-- Supabase는 public 스키마의 표를 PostgREST로 자동 노출한다. 두 겹으로 막는다.
--
--   1. RLS를 켜고 정책을 하나도 만들지 않는다 → 정책 기반 접근이 전부 막힌다
--   2. anon·authenticated의 표 권한 자체를 회수한다 → RLS 이전 단계에서 막힌다
--
-- 1번만으로 충분해 보이지만, 프로젝트 생성 시점에 따라 기본 grant가 다를 수
-- 있어 2번을 함께 건다. 공개 서비스의 계측 표이므로 이 상태가 기본이어야 한다.
alter table public.generations enable row level security;

revoke all on table public.generations from anon, authenticated;
grant select, insert, update on table public.generations to service_role;


-- ════════════════════════════════════════════════════════════════════
-- 판정 질의
--
-- 자료가 생기기 전에 고정한다. 결과를 본 뒤 정의를 손대지 않기 위해서다.
-- 여기서부터는 100건을 다 모은 뒤 SQL Editor에서 실행한다.
-- ════════════════════════════════════════════════════════════════════

-- 분석용 뷰는 노출되지 않는 스키마에 만든다.
--
-- **public 스키마에 만들면 안 된다.** Postgres 뷰는 기본적으로 뷰 소유자 권한
-- 으로 실행되므로, 기반 표에 RLS를 켰어도 뷰를 거치면 우회된다. public에 두면
-- PostgREST가 그 뷰를 자동 노출하고, 계측 행이 그대로 새어 나갈 수 있다.
-- private 스키마는 PostgREST가 노출하지 않는다.
--
-- security_invoker까지 함께 건다 — 스키마를 옮기는 실수가 나도 뷰가 호출자
-- 권한으로 돌아 RLS가 살아 있게 하려는 것이다.
create schema if not exists private;
revoke all on schema private from anon, authenticated;

-- 대상 100건. 이후 질의는 전부 이 집합 위에서 센다.
--
-- 입력 검사에서 막힌 요청은 pending insert 전에 끝나므로 애초에 행이 없다.
-- 즉 이 표의 모든 행은 검사를 통과한 요청이다.
--
-- 정렬에 operation_id를 더한 이유는 동시 요청의 started_at이 같을 수 있기
-- 때문이다. 그러면 100번째가 실행할 때마다 달라져 판정이 흔들린다.
create or replace view private.v_observation_target
with (security_invoker = true) as
select *
from public.generations
where kind = 'create'
  and configured_mode = 'routed'
  and is_smoke = false
  and started_at >= timestamptz '2026-01-01 00:00:00+00'  -- :start_at 으로 교체
order by started_at, operation_id
limit 100;


-- p̂ — 반사실 캐시 적중률 상한.
--
-- full로 배포했다면 캐시가 맞았을 요청의 비율이다. delivered_mode를 보지 않는다:
-- 그 세계에서는 검사를 통과한 create와 refine이 전부 같은 full 접두사를 보낸다.
--
-- **선행 요청에서 smoke를 빼지 않는다.** 대상 100건에서는 smoke를 빼는 게 맞지만,
-- 직전 smoke 요청도 full 세계에서는 캐시를 데웠을 것이다. 빼면 사전등록의
-- 정의와 어긋나고 p̂이 실제보다 낮게 나온다 — routed를 유지하는 쪽으로 기운다.
with target as (
  select operation_id, started_at from private.v_observation_target
)
select
  count(*)                                          as n,
  count(*) filter (where has_warm_predecessor)      as warm,
  round(
    100.0 * count(*) filter (where has_warm_predecessor) / nullif(count(*), 0),
    1
  )                                                 as p_hat_percent
from (
  select
    t.operation_id,
    exists (
      select 1
      from public.generations g
      where g.started_at <  t.started_at
        and g.started_at >= t.started_at - interval '5 minutes'
    ) as has_warm_predecessor
  from target t
) s;


-- f — 전환율. F1~F6으로 full에 전환해 생성까지 간 비율.
--
-- 결제·인증·429 중단은 Sonnet을 부르지 않으므로 generation_attempted가 false다.
-- 전환이 아니라 중단이라 f에서 빠진다.
select
  count(*)                                                       as n,
  count(*) filter (where delivered_mode = 'full'
                     and generation_attempted)                   as fell_back,
  round(100.0 * count(*) filter (where delivered_mode = 'full'
                                   and generation_attempted)
        / nullif(count(*), 0), 1)                                as f_percent,
  count(*) filter (where not generation_attempted)               as stopped_before_generation
from private.v_observation_target;


-- 전환 이유 분해. F1이 5%를 넘으면 f와 무관하게 조사한다.
select
  reason,
  count(*) as n
from private.v_observation_target,
     lateral unnest(coalesce(fallback_reason_ids, '{}')) as reason
group by reason
order by reason;


-- F1의 두 갈래. 업스트림 실패와 우리 코드의 후처리 실패는 고칠 곳이 다르다.
-- selection-processing이 하나라도 나오면 비율과 무관하게 버그다.
select
  selection_error_stage,
  selection_error_category,
  count(*) as n
from private.v_observation_target
where selection_error_stage is not null
group by selection_error_stage, selection_error_category
order by n desc;


-- 사용자에게 전달된 실패. 결제·인증·사용량 상한은 3건을 넘으면 즉시 알린다.
select
  status,
  error_code,
  count(*) as n
from private.v_observation_target
group by status, error_code
order by n desc;


-- 비용. 분모는 100(요청 수)이지 성공 건수가 아니다.
-- usage가 없는 실패의 비용은 잡지 못하므로 관측 가능한 비용의 하한이다.
--
-- 단가(2026-08-28 확인, docs/.../2026-08-28-routing-comparison/PRE-REGISTRATION.md):
--   Sonnet 5  입력 $2 / 출력 $10 / 캐시 생성 = 입력×1.25 / 캐시 읽기 = 입력×0.1
--   Haiku 4.5 입력 $1 / 출력 $5
with cost as (
  select
      coalesce(selection_usage_input_tokens, 0)                 * 1.0  / 1e6
    + coalesce(selection_usage_output_tokens, 0)                * 5.0  / 1e6
    + coalesce(generation_usage_input_tokens, 0)                * 2.0  / 1e6
    + coalesce(generation_usage_output_tokens, 0)               * 10.0 / 1e6
    + coalesce(generation_usage_cache_creation_input_tokens, 0) * 2.5  / 1e6
    + coalesce(generation_usage_cache_read_input_tokens, 0)     * 0.2  / 1e6
      as usd
  from private.v_observation_target
)
select
  count(*)                              as n,
  round(sum(usd)::numeric, 4)           as observed_total_usd,
  round((sum(usd) / 100.0)::numeric, 5) as per_request_usd
from cost;


-- 시간. 판정선의 중앙값은 status='success'에만 매긴다.
--
-- generation_attempted만으로는 부족하다 — Sonnet에서 곧바로 401·429가 나도
-- true라, 몇 초짜리 빠른 실패가 중앙값을 끌어내린다.
select
  'success (판정 대상)' as bucket,
  count(*)              as n,
  percentile_cont(0.5) within group (order by total_ms)  as median_ms,
  percentile_cont(0.9) within group (order by total_ms)  as p90_ms,
  max(total_ms)                                          as max_ms
from private.v_observation_target
where status = 'success' and total_ms is not null
union all
select
  'generation_ms 있음 (참고)',
  count(*),
  percentile_cont(0.5) within group (order by generation_ms),
  percentile_cont(0.9) within group (order by generation_ms),
  max(generation_ms)
from private.v_observation_target
where generation_ms is not null
union all
select
  'selection (p90 3초 확인)',
  count(*),
  percentile_cont(0.5) within group (order by selection_ms),
  percentile_cont(0.9) within group (order by selection_ms),
  max(selection_ms)
from private.v_observation_target
where selection_ms is not null;


-- 시간 분포 — 판정에 넣지 않고 따로 보고하는 것들.
select
  status,
  count(*) as n,
  percentile_cont(0.5) within group (order by total_ms) as median_total_ms
from private.v_observation_target
where status <> 'success'
group by status;


-- 계측 유실 — stale pending.
--
-- 마지막 요청 뒤 300초가 지난 다음에 센다. 그 전에 세면 아직 정상 실행 중인
-- 요청을 유실로 오인한다.
--
-- missing_row(insert 오류가 났고 행이 실제로 없는 것)는 이 표에 흔적이 없으므로
-- SQL로 셀 수 없다. Vercel 로그의 generate-skill-persistence-error 중
-- stage='pending-insert'인 operation_id를 뽑아 아래 결과와 합집합으로 센다.
--
--   계측 유실률 = distinct(missing_row ∪ stale_pending)
--                 ÷ (대상 행 수 + missing_row 수)
--
-- stage='final-update' 오류 로그는 진단용이다. 갱신이 정말 안 됐다면 그 행은
-- 여전히 pending이라 아래 질의가 이미 잡는다. 따로 더하면 중복이다.
select
  count(*) filter (where status = 'pending')                    as stale_pending,
  count(*)                                                      as target_rows,
  max(started_at)                                               as last_started_at,
  now() - max(started_at)                                       as elapsed_since_last
from private.v_observation_target;
