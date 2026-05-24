---
sidebar_position: 5
title: "콘텐츠 번역"
---
# 콘텐츠 번역 (Hugo Markdown)

Rosetta는 코드 블록, 숏코드 및 구조화된 요소를 완벽하게 보호하면서 Front Matter 필드와 본문 콘텐츠를 포함한 Hugo Markdown 파일을 번역해요.

## 설정

Markdown 콘텐츠 번역을 활성화하려면 설정에서 `contentDir`을 설정해 주세요:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync    # translates both string files and content files
```

## 번역되는 항목

### Front Matter

YAML(`---`)과 TOML(`+++`) 구분 기호를 모두 지원해요. 기본적으로 다음 필드가 번역돼요:

- `title`
- `description`
- `summary`
- `subtitle`
- `caption`
- `linkTitle`

다른 모든 필드(`date`, `draft`, `tags`, `weight`, `slug` 등)는 있는 그대로 보존돼요. 설정에서 `translatableFields`를 사용해 커스터마이즈해 보세요.

### 본문 콘텐츠

전체 Markdown 본문은 블록 보호 기능과 함께 번역돼요. 구조화된 요소는 번역 전에 유니코드 센티널(sentinel) 자리 표시자를 사용해 보호되고 번역 후에 다시 복원돼요.

## 블록 보호

다음 요소들은 번역되지 않고 그대로 유지돼요:

| 요소 | 예시 | 보호 방식 |
|---------|---------|-----------|
| 코드 블록 | ``````` ```js ... ``` ``````` | 전체 블록 보호됨 |
| 인라인 코드 | `` `variable` `` | 보호됨 |
| Hugo 숏코드 | `{{< figure >}}`, `{{% note %}}` | 전체 블록 보호됨 |
| 원시 HTML | `<div>`, `<table>` | 보호됨 |
| 링크 (URL) | `[text](https://...)` | URL은 보존되고 텍스트는 번역됨 |
| 보간(Interpolation) | `{{ .Count }}` | 보호됨 |

## 파일 이름 규칙

Hugo의 파일 이름 기반 번역 패턴을 따라요:

```
my-post.md      → my-post.fr.md
my-post.en.md   → my-post.fr.md  (strips source suffix)
```

## 건너뛰기 동작

기존에 번역된 파일은 **절대 덮어쓰지 않아요**. `my-post.fr.md` 파일이 이미 존재하면 건너뛰게 돼요. 강제로 다시 번역하려면 대상 파일을 삭제해 주세요.

## Markdown 전용 메서드

:::warning Google Translate와 Markdown
Google Translate는 코드 블록, 숏코드 또는 보간 변수를 **전혀 인식하지 못해요**. 따라서 구조화된 Markdown 콘텐츠를 손상시킬 수 있어요. 콘텐츠 번역에는 구조화된 요소를 명시적으로 보호해 주는 LLM 메서드(`llm` 또는 `llm-coached`)를 사용해 주세요.
:::

콘텐츠 번역이 Google Translate에서 LLM 메서드로 대체되는 경우, rosetta는 그 이유를 설명하는 경고를 기록해요.