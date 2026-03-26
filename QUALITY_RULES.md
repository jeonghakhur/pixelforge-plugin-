# PixelForge Plugin — Quality Rules

## 디자인 토큰 (변경 금지)
| Token | Value | Usage |
|-------|-------|-------|
| --bg-base | #1A1A1A | 최하단 배경 |
| --bg-card | #2A2A2A | 카드 배경 |
| --bg-card2 | #333333 | 중간 톤 |
| --border | #3A3A3A | 구분선 |
| --text-primary | #FFFFFF | 주요 텍스트 |
| --text-secondary | #9B9B9B | 보조 텍스트 |
| --accent | #3B82F6 | 강조/버튼 |
| --success | #3DDC84 | 성공/통과 |
| --warning | #F5B731 | 주의 |
| --danger | #FF4D4F | 실패/오류 |
| --radius-card | 16px | 카드 반경 |
| --radius-btn | 10px | 버튼 반경 |
| --radius-pill | 100px | pill 반경 |

## 간격 (4px 배수 체계)
4, 8, 12, 16, 20, 24, 32px만 사용

## 타이포그래피
- 제목: 700 (Bold), 16px
- 본문: 400 (Regular), 13px
- 캡션: 400, 11px
- 최소 크기: 11px

## 컴포넌트 규칙
- 버튼 최소 터치 타겟: 36px (Figma 플러그인 특성상 완화)
- 카드: 배경 --bg-card, radius 12px, padding 14px
- 탭(메인): 언더라인 스타일, --accent 색
- 탭(서브/pill): --bg-card 배경, radius 100px, 11px

## Claude Code 작업 규칙
1. 작업 전 이 파일 반드시 읽기
2. 위 토큰 외 새 색상값 임의 추가 금지
3. 간격은 4px 배수만 사용
4. 컴포넌트 추가 시 기존 패턴 먼저 확인 후 동일하게
5. 빌드 전 색상/간격 값 직접 쓴 곳 없는지 확인
