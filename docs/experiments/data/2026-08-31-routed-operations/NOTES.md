# routed 운영 관찰 실행 기록 (2026-09-01~)

`PRE-REGISTRATION.md`에 고정한 절차를 실제로 밟으면서 남기는 기록이다.
사전등록 문서는 결과를 본 뒤 고치지 않기로 했으므로, 실행 중에 생긴 일은
전부 이쪽에 적는다.

## 1차 배포와 smoke 시도 — 무효 (2026-09-01)

**smoke를 시작하지 못했다.** `CORPUS_ROUTING_MODE`의 값에 오타가 있어 배포가
routed로 뜨지 않았다. 세 요청 모두 `configured_mode=full`로 처리됐다.

사전등록의 synthetic smoke는 `CORPUS_ROUTING_MODE=routed`인 배포를 전제한다.
그 전제가 성립하지 않았으므로 **이 시도는 실패한 smoke가 아니라 시작되지 않은
smoke다.** 판정하지 않고, 예상 예산과 중단선도 소진한 것으로 보지 않는다 —
2차 시도에 사전등록 값을 그대로 적용한다.

| 항목 | 값 |
|---|---|
| 배포 | `dpl_Fw3yHRN9fEPywUVgyPuxGZd2Dxnq` |
| 커밋 | `2b9fd7e` |
| 요청 | create 2건, refine 1건 (2026-09-01 15:16~15:18 UTC) |
| 결과 | 전부 `status=success`, `configured_mode=full` |
| 태운 비용 | **$0.270522** (콜드 $0.185108 + 캐시 적중 $0.042360 + $0.043054) |

비용은 저장된 usage로 계산했다(`sonnet $2/$10`, `haiku $1/$5`, 쓰기 1.25배,
읽기 0.1배). 이 돈은 smoke 비용이 아니라 **설정 실패로 태운 비용**이다.
사전등록의 `$0.27~0.30` 예산과 `$0.35` 중단선은 2차 시도에 그대로 살아 있다.

### 그래도 확인된 것

같은 요청들이 계측 배선은 실제로 통과했다. 2차 시도에서 다시 볼 필요가 없다.

- Supabase 저장이 프로덕션 경로에서 동작한다. pending 행이 만들어지고 최종
  상태로 갱신됐다
- `deployment_id`가 세 행 모두 채워졌다. 시스템 환경변수 자동 노출이 켜져 있다
- `kind`가 create/refine으로 갈렸다

확인하지 못한 것은 `status=pending`을 직접 본 것(통과 조건 3)이다. 세 행 모두
이미 최종 상태였다. 2차 시도에서 다시 노린다.

### 남은 행 처리

세 행은 `configured_mode=full`이라 `v_observation_target`이 이미 걸러낸다.
100건에 들어갈 수 없다. 기록을 위해 지우지 않고 남기며, `operation_id`는
사전등록의 「표본 제외용 확인 요청 기록」 표에 적는다.

### 조치

`CORPUS_ROUTING_MODE` 값을 고치고 재배포했다. 새 배포는
`dpl_Eb7E3dt5ZWdcCr7NuMwyTHrdJJxQ`다.

## 2차 배포와 smoke — 통과 (2026-09-01)

`CORPUS_ROUTING_MODE` 오타를 고치고 재배포한 `dpl_Eb7E3dt5ZWdcCr7NuMwyTHrdJJxQ`
에서 사전등록의 「synthetic smoke 절차」를 그대로 밟았다. **통과 조건 일곱 개를
모두 충족했다.**

| 항목 | create `7bba112e` | refine `4798e3c3` |
|---|---|---|
| `status` | success | success |
| `configured_mode` / `delivered_mode` | routed / **routed** | routed / **full** |
| `selection_status` / fallback | success / false | null (선택 미실행) |
| `injected_bytes` | 34,025 | 141,597 |
| `delivered_pattern_count` | 28 | null |
| 선택 시간 | 1.287초 | — |
| 생성 시간 / 전체 | 33.6초 / 35.9초 | 27.4초 / 28.5초 |
| 캐시 쓰기 / 읽기 | 0 / 0 | 63,999 / 0 |

- **routed가 실제로 적은 코퍼스만 넣었다.** 34,025바이트로 full의 24%다.
- **정제는 설정과 무관하게 full이다.** `configured_mode=routed`인 배포에서
  `delivered_mode=full`, `selection_status=null`로 끝났다.
- **routed 생성에는 캐시를 걸지 않는다**는 설계가 그대로 나타났다(쓰기·읽기 0).
  정제는 5분 TTL이 지나 full 접두사를 새로 썼다(63,999).
- pending 행을 응답 전에 직접 관측했다(`status=pending`, `delivered_mode=null`).
  pending insert → 생성 → `after()` 최종 갱신 순서가 프로덕션에서 확인됐다.
- Vercel 로그에서 create는 `generate-skill-routing`+`generate-skill`,
  refine은 `generate-skill`만 같은 `operationId`로 이어졌다. 입력 원문과
  생성 결과 전문은 어느 줄에도 없었다. `persistence-error`는 검색 결과가 없다.
- 두 행의 `deployment_id`가 서로 같고 실제 배포 ID와 일치했다.

### 비용 — 예측과 실측

저장된 usage로 계산했다. 가격은 `sonnet $2/$10`, `haiku $1/$5`, 쓰기 1.25배.

| 요청 | 실측 |
|---|---:|
| routed create (선택 $0.004100 + 생성 $0.061164) | $0.065264 |
| full refine | $0.194546 |
| **합계** | **$0.259810** |

사전등록 예측은 $0.26539였다. **예측보다 $0.005580 낮았다(예측 대비 2.10%).**
예산 상한 $0.30과 추가 요청 중단선 $0.35 아래에서 끝났다.

**3단계 전체로는 $0.530332를 썼다** — 무효였던 1차 $0.270522와 유효한 2차
$0.259810의 합이다. 사전등록의 예산과 중단선은 smoke 한 번을 재는 값이므로
2차만 그 대상이고, 1차는 설정 실패 비용으로 따로 센다.

시간도 8단계 실측과 가깝다 — 선택 1.287초(실측 1.10초), create 전체
35.9초(end-to-end 실측 35.1초).

### 관찰 시작

Smoke 종료 시각 **2026-09-01 15:38:15.740783+00**을
`private.v_observation_target`의 `started_at` 하한에 넣었다. 1차 시도 3건과
smoke 2건은 `is_smoke=true`로 표시했다. 뷰는 0건에서 시작한다.

이 시각 이후에 도착하는 `kind=create`·`configured_mode=routed`·`is_smoke=false`
요청이 관찰 대상 100건이다.

## 관찰 기준 시각 이동 (2026-09-02)

| 항목 | 값 |
|---|---|
| 이전 하한 | `2026-09-01 15:38:15.740783+00` |
| 새 하한 | `2026-09-02 12:41:23+00` |
| 커밋 | `ba0ed05` (`fix(prompt): use only the first line of the filename tag`) |
| 배포 완료 | 2026-09-02 12:41:23+00 (21:41:23 KST) |
| 이동 직전 대상 | 0건 (전체 5건은 모두 `is_smoke=true`) |

**옮긴 이유는 기록 목적이 아니라 사전등록 규정이다.** PRE-REGISTRATION.md
「구현 전에 정할 것」 마지막 문단이 *"프로덕션 생성 경로의 동작 (…) 은 이 관찰
중에 바꾸지 않는다. 바꾸면 그 시점에서 100건을 다시 센다"*고 정해 두었다.
`ba0ed05`가 `extractFilename`을 도입해 생성 경로의 파일명 추출 동작을 바꿨으므로
그 규정에 해당한다.

**버린 표본은 없다.** 이전 하한 이후 도착한 대상 요청이 0건이었다. 재계수의
비용이 0인 시점이라 파서 수정을 먼저 배포하고 하한을 옮겼다.

**사전등록 원문은 고치지 않았다.** 사전등록은 자료를 보기 전에 고정한 문서이고,
이 이동은 그 문서가 정한 규칙을 적용한 결과이지 규칙의 변경이 아니다.

뷰는 `create or replace`로 갱신했고 `docs/operations/generations-table.sql`의
정의도 같은 값으로 맞췄다. 갱신 뒤 뷰는 다시 0건이다.
