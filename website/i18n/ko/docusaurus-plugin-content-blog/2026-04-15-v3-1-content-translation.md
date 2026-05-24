---
slug: v3-1-content-translation
title: "v3.1.0: Hugo Markdown 콘텐츠 번역"
authors: [curtisforbes]
tags: [release]
date: 2026-04-15
---
v3.1.0에는 전체 Hugo Markdown 콘텐츠 번역 기능이 추가되었어요. front matter 필드와 본문 콘텐츠를 번역하며, code block, shortcode, interpolation variable을 자동으로 보호해 줘요.

<!-- truncate -->

## 콘텐츠 인식 번역

Markdown을 번역할 때 원본 파일을 LLM에 그대로 보낼 수는 없어요. Code block이 번역되거나, shortcode가 손상되거나, Hugo template variable이 망가질 수 있거든요.

Rosetta v3.1.0은 **Unicode sentinel shielding**으로 이 문제를 해결해요:

1. 번역하기 전에 구조화된 블록(code fence, shortcode, inline code, HTML)을 고유한 sentinel token으로 교체해요.
2. LLM은 번역 가능한 텍스트만 받게 돼요.
3. 번역이 끝나면 sentinel을 원래 콘텐츠로 복원해요.

LLM은 code block을 전혀 볼 수 없으므로, 이를 손상시킬 수 없어요.

## Front Matter 지원

YAML(`---`) 및 TOML(`+++`) front matter 구분자를 모두 지원해요. 기본적으로 `title`, `description`, `summary`, `subtitle`, `caption`, `linkTitle`가 번역돼요. 그 외의 모든 필드(date, draft, tags, weight)는 그대로 유지돼요.

## 설정

```json title="i18n-rosetta.config.json"
{
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync   # now translates content too
```

자세한 내용은 [콘텐츠 번역 가이드](/docs/guides/content-translation)를 참고해 주세요.