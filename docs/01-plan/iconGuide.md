src/generated/icons/IconFeatured/
├── IconFeatured.tsx  
 └── index.ts

이름 변환 추적:

- Figma: "Featured icon"
- "Featured icon".replace(/\bicon\b/gi, '').trim() → "Featured"
- 최종: Icon + Featured = IconFeatured  


---

컴포넌트 props 인터페이스

interface IconFeaturedProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
type?: 'light' | 'dark' | 'gradient' | 'modern' | 'modern neue';  
 size?: 'sm' | 'md' | 'lg' | 'xl';  
 color?: 'brand' | 'gray' | 'error' | 'warning' | 'success';  
 }

---

사용 예제

// 기본값 (type="light", size="xl", color="brand")
<IconFeatured />

// 타입별  
 <IconFeatured type="dark"     color="brand"   size="xl" />  
 <IconFeatured type="gradient" color="error"   size="lg" />  
 <IconFeatured type="light"    color="success" size="sm" />

// Modern/Modern neue는 gray만 지원 → color 생략하는 게 자연스러움  
 <IconFeatured type="modern"     size="xl" />  
 <IconFeatured type="modern neue" size="md" />

// SVG 네이티브 props 그대로 전달 가능  
 <IconFeatured type="dark" color="brand" size="sm" className={styles.icon} />

---

문제점 2가지

① "modern neue" — 공백 포함 값

TypeScript 상 유효하지만 사용성이 나쁩니다.

// 현재 (공백)  
 <IconFeatured type="modern neue" />

// 더 나은 방향 (kebab 또는 camelCase)  
 <IconFeatured type="modern-neue" />  
 <IconFeatured type="modernNeue" />

값 정규화가 필요합니다 (val.toLowerCase().replace(/\s+/g, '-')).

② 스파스 매트릭스 — TypeScript가 잘못된 조합을 허용

// 컴파일 통과하지만 Modern은 gray만 존재  
 <IconFeatured type="modern" color="brand" /> // ← 색상 없이 렌더됨, 경고 없음

타입 오버로드로 정확히 제한하려면 복잡해집니다. 실용적으로는 그냥 color 매핑이 없으면 원본 SVG 색상  
 유지하는 것으로 두는 게 현실적입니다.

src/generated/icons/IconFeaturedIconOutline/
├── IconFeaturedIconOutline.tsx ← "Icon"이 두 번 들어감  
 └── index.ts

"Featured icon outline" → FeaturedIconOutline (pascal 그대로) → Icon + FeaturedIconOutline =
IconFeaturedIconOutline

버그: 플러그인이 보내는 pascal: "FeaturedIconOutline" 안에 Icon이 중간에 있는데, 현재 코드는 끝에 있는  
 Icon만 제거합니다. 이상적인 이름은 IconFeaturedOutline이어야 합니다.

---

예제 코드

// 기본값 (size="md", color="brand")
<IconFeaturedOutline />

// 컬러 변경  
 <IconFeaturedOutline color="error" />  
 <IconFeaturedOutline color="success" />  
 <IconFeaturedOutline color="gray" />

// 사이즈 변경  
 <IconFeaturedOutline size="sm" /> // 34×34, clipPath 구조
<IconFeaturedOutline size="md" /> // 38×38, clipPath 구조  
 <IconFeaturedOutline size="lg" /> // 42×42, 단순 구조  
 <IconFeaturedOutline size="xl" /> // 46×46, 단순 구조

// 조합  
 <IconFeaturedOutline size="xl" color="brand" />  
 <IconFeaturedOutline size="sm" color="warning" />

---

발견된 문제 2가지

① 이름에 Icon 중복

"Featured icon outline" → pascal: "FeaturedIconOutline"  
 → Icon + FeaturedIconOutline  
 = IconFeaturedIconOutline ← 중복

플러그인이 pascal을 보낼 때 중간의 Icon을 제거하지 않아서 발생합니다. resolvedComponentName에서 중간  
 Icon도 제거해야 합니다.

② Size별로 SVG 구조가 다름 — 현재 코드가 처리 못함

xl/lg → 단순 구조 (링 2개, path)  
 md/sm → 복잡 구조 (+ defs, clipPath, rect)

현재 Strategy C는 단일 SVG 구조를 기준으로 색상/사이즈만 교체합니다. md 구조를 베이스로 쓰면 xl/lg에서  
 시각적으로 올바르지 않게 렌더될 수 있습니다.

이 케이스는 "사이즈에 따라 SVG 구조가 다른" 새로운 패턴으로, Strategy C와 F 사이 어딘가에 있습니다.
