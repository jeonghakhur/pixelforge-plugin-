# PixelForge Token Extractor — Changelog

> **Project Version**: 1.5.8
>
> **Last Updated**: 2026-03-31

---

## [2026-03-31] — Text Token Split & Card Opt-in UX

### Added

- **Card Opt-in UX**: 모든 토큰 카드 기본 비활성화 → 사용자 의도적 선택
- **Text Styles 세분화**: 단일 texts 타입을 3개로 분리
  - `textStyles`: 본문/라벨 계열 (Text, Label, Caption, Body, Paragraph)
  - `headings`: 제목 계열 (Heading, Display, Title, H1~H6)
  - `fonts`: 고유 폰트 패밀리 → CSS 변수 자동 생성
- **FontData Interface**: `{ family: string, cssVar: string, styles: string[] }`
- **convertFonts() Function**: CSS `:root { --font-*: "Family"; }` 자동 생성
- **HEADING_RE Pattern**: `/\b(heading|display|title|h[1-6])\b/i` 정규식 기반 분류
- **New Token Cards**: 3개 신규 UI 카드 (textStyles/headings/fonts) + 아이콘
- **i18n Strings**: 한/영 지원 (textStylesCard, headingsCard, fontsCard)

### Changed

- **ExtractedTokens.styles**: texts 유지 (하위 호환) + textStyles/headings/fonts 추가
- **ExtractOptions.tokenTypes**: 'textStyles' | 'headings' | 'fonts' 타입 추가
- **extractAll() Logic**: needsTextSplit 조건으로 분류 로직 통합
- **ui.html Token Cards**: 기존 texts 제거 → 신규 3개 카드로 교체
- **ui.html Stat Cards**: textCount 제거 → textStyles/headings/fonts 추가

### Fixed

- **Backward Compatibility**: `styles.textStyles || []` 폴백으로 구 캐시 데이터 호환
- **Font Family Handling**: 빈 fontName.family 안전 처리 (`family.trim() === ''` 체크)
- **CSS Variable Generation**: 특수문자 제거 로직으로 유효한 CSS 변수명 생성
  - "SF Pro Text" → "--font-sf-pro-text"

### Technical Details

| Component | Changes | Files |
|-----------|---------|-------|
| Interfaces | FontData, ExtractedTokens.styles 확장, ExtractOptions 확장 | src/code.ts |
| Functions | mapTextStyle() 분리, collectFonts() 신규, extractAll() 분류 로직 | src/code.ts |
| Converters | convertFonts() 신규 함수 추가 | src/converters/typography.js |
| UI Logic | generateCSS() 신규 블록, getFilteredData() 폴백, stats 렌더링 | src/ui.js |
| UI Markup | 모든 카드 active 제거, 3개 신규 카드/stat, i18n 키 추가 | src/ui.html |

### Quality Metrics

- **Design Match Rate**: 100% (50/50 items verified)
- **Iterations**: 0 (첫 구현 완료)
- **Build Status**: ✅ Pass
- **Backward Compatibility**: ✅ Maintained

### PDCA Cycle Summary

| Phase | Duration | Outcome |
|-------|----------|---------|
| Plan | 1h | 요구사항 명확화 (9개 FR) |
| Design | 2h | 상세 설계 (10개 섹션, 엣지 케이스 포함) |
| Do | 3h | 4개 파일 수정 (50개 항목) |
| Check | 0.5h | 100% 자동 분석 (gap-detector) |
| Act | 0.5h | 보고서 작성 (현재 문서) |

**Total PDCA Cycle**: 6.5 hours, **Match Rate**: 100%

---

## Future Enhancements

- [ ] **v2**: Font weight scale variables (`--font-weight-bold`, `--font-weight-medium`)
- [ ] **v2**: Label/Caption 카테고리 별도 분리
- [ ] **v2**: E2E test suite (Playwright)
- [ ] **v3**: Developer guide — typography token 활용법
