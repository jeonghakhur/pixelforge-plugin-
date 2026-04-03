# Plan: 토큰 검증 시스템

_플러그인 → 앱 → 대시보드로 이어지는 토큰 품질 관리_

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | token-validation |
| Goal | 토큰 품질 자동 검증 + 대시보드 분석 |
| Scope | 플러그인(검증) → 앱(저장) → 대시보드(리포트) |
| Core Value | "정의한 토큰이 실제로 쓰이는가?" 명확화 |

---

## 🎯 Goals

1. **플러그인 검증**: Extract 후 토큰 품질 즉시 피드백
2. **앱 저장**: 검증 데이터 DB 저장 & 버전 관리
3. **대시보드 분석**: 토큰 품질 리포트 & 개선 제안

---

## 📊 검증 규칙

### 1️⃣ 구조 검증
```
✅ kebab-case 형식
   color/primary/default → OK
   color_primary_default → ERROR
   Color/Primary → ERROR

✅ category/value 또는 category/subcategory/state
   spacing/md → OK
   color/primary → WARNING (state 부족)
   button → ERROR (형식 부족)
```

### 2️⃣ 미사용 토큰
```
기준: boundVariable 참조 0번
분류:
- frequency = 0 → "확실히 삭제" 범주
- frequency 1-3 → "다음 버전 고려" 범주
- frequency > 10 → "자주 쓰임" 표시
```

### 3️⃣ 값 검증
```
색상:
✅ #0066FF, #00AAFF (16진수 대문자)
❌ #0066ff (소문자)
❌ #66FF (3자리)
❌ rgb(...), hsl(...)

간격 (설계 규칙: 4px 단위):
✅ 4, 8, 12, 16, 20, ...
❌ 5, 7, 13, ...
```

### 4️⃣ 완전성 검증
```
state 조합:
✅ primary/default + primary/hover + primary/active
❌ primary/default 만 있음 (다른 상태 부족)

모드 대칭:
✅ Light 모드 + Dark 모드 모두 정의
❌ Light만 정의됨
```

---

## 📐 Data Structure

### 플러그인 → 앱 전송

```typescript
interface TokenValidationReport {
  // 메타데이터
  projectId: string;
  extractedAt: string;
  
  // 검증된 토큰
  tokens: TokenWithValidation[];
  
  // 종합 통계
  summary: {
    total: number;
    valid: number;
    warnings: number;
    errors: number;
    quality: number; // 0-100
  };
  
  // 카테고리별 결과
  analysis: {
    byStatus: {
      'unused': string[];           // frequency=0
      'lowFrequency': string[];     // frequency 1-3
      'frequent': string[];         // frequency > 10
    };
    byIssue: {
      'structureError': string[];
      'valueError': string[];
      'incomplete': string[];
    };
  };
}

interface TokenWithValidation {
  name: string;
  value: string;
  
  // 검증 결과
  validation: {
    structureOk: boolean;
    valueOk: boolean;
    used: boolean;
    frequency: number;
    usedIn: { node: string; count: number }[];
  };
  
  // 추천사항
  recommendation: {
    level: 'DELETE' | 'REVIEW' | 'KEEP';
    reason: string;
  };
}
```

### 앱 DB 저장

```sql
-- tokens 테이블에 추가
ALTER TABLE tokens ADD COLUMN (
  validation_status ENUM('CLEAN', 'WARNING', 'ERROR'),
  frequency INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  quality_score NUMERIC(3, 2),
  
  UNIQUE(project_id, name)
);

-- 새 테이블: token_validations (이력 관리)
CREATE TABLE token_validations (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  validation_id VARCHAR(64) UNIQUE,  -- 동일 검증 감지
  
  -- 검증 결과
  total_tokens INTEGER,
  quality_score NUMERIC(3, 2),
  
  -- 이슈별 카운트
  unused_count INTEGER,
  lowfreq_count INTEGER,
  error_count INTEGER,
  
  -- 상세 리포트 (JSON)
  report JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_project_quality ON token_validations(project_id, quality_score);
```

---

## 🏗️ 아키텍처

### 플러그인 (검증)

```
extract 버튼 클릭
  ↓
1. 토큰 추출 (기존 로직)
  ↓
2. 검증 실행 (새로운 로직)
  ├─ 구조 검증 (100ms)
  ├─ boundVariables 스캔 (500-2000ms)
  ├─ 값 검증 (100ms)
  └─ 완전성 검증 (100ms)
  ↓
3. 결과 UI 표시
  ├─ ✅ 정상 / ⚠️ 경고 / ❌ 오류
  ├─ 품질 점수 (0-100)
  └─ "자세히 보기" 버튼
  ↓
4. "PixelForge로 전송" 버튼
  → validation 데이터 함께 전송
```

### 앱 (저장 & 분석)

```
POST /api/sync/tokens
  ← { tokens, validation: TokenValidationReport }
  
1. 검증 데이터 저장
   token_validations 테이블
  
2. 토큰별 상태 업데이트
   tokens 테이블 > validation_status, frequency
  
3. 응답
   → { success, qualityScore, analysis }
```

### 대시보드 (리포트)

```
Analytics 탭
  ├─ 品質 점수 (0-100)
  ├─ 토큰 사용 현황
  │  ├─ 정의: X개
  │  ├─ 사용: Y개 (Z%)
  │  └─ 미사용: W개 (V%)
  ├─ 문제점 분석
  │  ├─ ❌ 구조 오류 (N개)
  │  ├─ ⚠️ 미사용 (N개)
  │  └─ 💡 저빈도 (N개)
  ├─ 개선 제안
  │  └─ "[삭제 제안] 3개 토큰 삭제 시 품질 90 달성"
  └─ 이력
     └─ 지난 검증 기록 (날짜순)
```

---

## 🔌 API Design

### POST /api/sync/tokens (업데이트)

**Request**
```json
{
  "projectId": "proj_xxx",
  "tokens": [...],
  "validation": {
    "summary": {
      "total": 127,
      "valid": 124,
      "warnings": 2,
      "errors": 1,
      "quality": 87
    },
    "analysis": {
      "byStatus": {
        "unused": ["color/primary/focus"],
        "lowFrequency": ["spacing/custom"],
        "frequent": ["color/primary/default"]
      }
    }
  }
}
```

**Response**
```json
{
  "success": true,
  "qualityScore": 87,
  "analysis": {
    "improvements": [
      {
        "action": "DELETE",
        "tokens": ["color/primary/focus"],
        "impact": "+3% 품질 개선"
      }
    ]
  }
}
```

### GET /api/analytics/tokens/:projectId

```json
{
  "project": { "id": "proj_xxx", "name": "..." },
  "current": {
    "qualityScore": 87,
    "total": 127,
    "used": 124,
    "unused": 3
  },
  "trend": [
    { "date": "2026-04-01", "quality": 85 },
    { "date": "2026-04-02", "quality": 87 }
  ],
  "issues": {
    "structural": ["color_primary"],
    "unused": ["color/primary/focus"],
    "lowFreq": ["spacing/custom"]
  }
}
```

---

## 📝 예시 시나리오

### Figma 토큰 추출 & 검증

```
1️⃣ 플러그인에서 "Extract" 클릭

2️⃣ 검증 수행
   color/primary/default
   ├─ 구조: ✅ OK
   ├─ 값: ✅ #0066FF (올바른 형식)
   ├─ 사용: 47회 (자주 쓰임)
   └─ 추천: KEEP ✅
   
   color/primary/focus
   ├─ 구조: ✅ OK
   ├─ 값: ✅ #0052CC
   ├─ 사용: 0회 (미사용)
   └─ 추천: DELETE ❌
   
   color_error (오타)
   ├─ 구조: ❌ kebab-case 아님
   ├─ 값: ❌ rgb(255,0,0) (RGB 형식)
   └─ 추천: REVIEW ⚠️

3️⃣ UI 표시
   ┌──────────────────┐
   │ 품질: 87/100 ✅  │
   │ 정의: 127개      │
   │ 사용: 124개 (97%)│
   │ 미사용: 3개 (2%) │
   │ 오류: 1개 (1%)   │
   └──────────────────┘

4️⃣ "PixelForge로 전송" 클릭
   → 토큰 + 검증 데이터 함께 전송

5️⃣ 앱에서 저장 & 분석
   → 대시보드 업데이트
```

---

## 🚀 Implementation Phases

### Phase 1: 플러그인 검증 (Week 1-2)
- [ ] 검증 규칙 구현
  - [ ] 구조 검증
  - [ ] boundVariables 스캔
  - [ ] 값 검증
  - [ ] 완전성 검증
- [ ] UI 추가
  - [ ] 검증 결과 표시
  - [ ] 품질 점수
  - [ ] 개선 제안
- [ ] 성능 최적화
  - [ ] 비동기 처리
  - [ ] 진행률 표시
  - [ ] 캐싱

### Phase 2: 앱 저장 & API (Week 2-3)
- [ ] 데이터 구조 정의
- [ ] POST /api/sync/tokens 업데이트
  - [ ] validation 데이터 수신
  - [ ] DB 저장
  - [ ] 분석 수행
- [ ] DB 스키마
  - [ ] token_validations 테이블
  - [ ] tokens 테이블 업데이트
- [ ] 테스트

### Phase 3: 대시보드 (Week 3-4)
- [ ] Analytics 탭 추가
- [ ] 품질 점수 시각화
- [ ] 이슈 분석 표시
- [ ] 개선 제안
- [ ] 이력 관리
- [ ] E2E 테스트

---

## ✅ Acceptance Criteria

- [ ] 플러그인에서 5가지 검증 규칙 모두 구현
- [ ] 검증 완료 시간 < 3초 (큰 파일)
- [ ] 검증 데이터 앱에 전송됨
- [ ] 앱에서 데이터 저장 & 분석
- [ ] 대시보드에 리포트 표시
- [ ] 개선 제안 시스템 동작
- [ ] 테스트 커버리지 > 80%

---

**작성**: 2026-04-03
**상태**: Draft (승인 대기 중)
