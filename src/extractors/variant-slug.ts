// src/extractors/variant-slug.ts
// variantProperties → 파일명/CSS 선택자에 사용 가능한 slug 식별자

/**
 * variant properties 맵을 slug 식별자로 변환한다.
 *
 * 규칙:
 *   1. 각 값 소문자화
 *   2. 공백 → '-' (kebab-case)
 *   3. 특수문자 제거 (_, -, a-z, 0-9만 허용)
 *   4. property 순서는 입력 맵의 선언 순서 유지
 *   5. '_'로 join
 *
 * @example
 *   buildVariantSlug({ size: 'md', hierarchy: 'Primary', state: 'Default' })
 *   // → 'md_primary_default'
 */
export function buildVariantSlug(props: Record<string, string>): string {
  return Object.values(props)
    .map((val) =>
      String(val ?? '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    )
    .filter((v) => v.length > 0)
    .join('_');
}
