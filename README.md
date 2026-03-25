# PixelForge Token Extractor

Figma Variables(토큰)와 Styles를 JSON으로 추출하는 Figma 플러그인.

## 설치

```bash
npm install
npm run build
```

## Figma에서 사용

1. Figma 데스크톱 앱 → Plugins → Development → Import plugin from manifest
2. 이 프로젝트의 `manifest.json` 선택
3. 플러그인 실행 → "토큰 추출하기" 클릭
4. JSON 복사 또는 파일로 다운로드

## 개발

```bash
npm run watch
```

## 추출 항목

- **Variables**: 로컬 변수 컬렉션 및 변수 (색상, 숫자, 문자열, boolean)
- **Color Styles**: Paint 스타일
- **Text Styles**: 폰트, 크기, 자간, 행간
- **Effect Styles**: 그림자, 블러 등
