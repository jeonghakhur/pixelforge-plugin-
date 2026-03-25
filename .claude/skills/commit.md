---
name: commit
description: Build 검증 후 자동 오류 수정, 커밋, 푸시를 순서대로 실행하는 스킬
triggers:
  - /commit
  - commit and push
  - 커밋하고 푸시
---

# Commit & Push with Auto-Fix

커밋 전 빌드 검증 → 오류 자동 수정 → 커밋 → 푸시 순서로 실행합니다.

## Workflow

### Step 1: 변경 사항 확인
```bash
git status
git diff --stat
```
변경된 파일이 없으면 중단하고 사용자에게 알린다.

### Step 2: 빌드 검증
```bash
npm run build
```

**빌드 성공 시** → Step 4로 이동
**빌드 실패 시** → Step 3으로 이동

### Step 3: 오류 자동 수정 (최대 3회 시도)

빌드 오류 메시지를 분석하고 다음 순서로 수정한다:

1. 오류 파일과 라인 번호를 파악한다
2. Read 툴로 해당 파일을 읽는다
3. Edit 툴로 오류를 수정한다
4. 다시 `npm run build` 실행
5. 3회 시도 후에도 실패하면 사용자에게 오류 내용을 보고하고 중단한다

### Step 4: 커밋 메시지 생성

```bash
git log --oneline -5
git diff --cached
git diff
```

변경 내용을 분석하여 Conventional Commits 형식으로 메시지를 작성한다:
- `feat:` 새 기능
- `fix:` 버그 수정
- `refactor:` 리팩토링
- `chore:` 기타 변경

### Step 5: 스테이징 및 커밋

민감한 파일(.env, credentials 등)은 제외하고 변경 파일을 스테이징한다.

```bash
git add <변경된 파일들>
git commit -m "$(cat <<'EOF'
<생성된 커밋 메시지>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### Step 6: 푸시

```bash
git push
```

리모트 브랜치가 없으면:
```bash
git push -u origin <현재 브랜치명>
```

### Step 7: 결과 보고

완료 후 다음을 출력한다:
- 커밋 해시와 메시지
- 푸시된 브랜치명
- 수정된 파일 목록 (오류 수정이 있었던 경우)
