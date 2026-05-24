---
sidebar_position: 1
title: "CLI 레퍼런스"
---
# CLI 레퍼런스

## 명령어

```
i18n-rosetta init              Interactive setup wizard (--yes for quick defaults)
i18n-rosetta sync              Translate & sync all locale files
i18n-rosetta watch             Auto-sync when the source file changes
i18n-rosetta audit             List all untranslated [EN] fallback values
i18n-rosetta lint              Scan source code for hardcoded strings
i18n-rosetta wrap              Auto-wrap hardcoded strings in t() calls (with undo)
i18n-rosetta seo <sub>         Generate hreflang, sitemap.xml, or JSON-LD schema
i18n-rosetta integrity         Audit locale files for format/encoding issues
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
```

특정 명령어에 대한 자세한 도움말을 보려면 `i18n-rosetta <command> --help`를 실행하세요.

## 전역 옵션

```
--help, -h              Show help (global or per-command)
--version, -v           Print version and exit
--yes, -y               Skip interactive prompts, use defaults
--config <path>         Custom config file path
--dir <path>            Override locales directory
--content-dir <path>    Hugo/Docusaurus content directory for Markdown translation
--source <code>         Override source locale (default: en)
--model <model>         Override translation model
--method <method>       Translation method: llm, google-translate (default: from config)
--format <fmt>          Locale file format: json, toml, yaml, or auto
--dry                   Preview changes without writing files
```

---

## init

`i18n-rosetta.config.json`를 생성하는 대화형 설정 마법사예요. 소스 로케일, 대상 언어, 파일 형식 및 번역 모델 설정을 안내해 줘요.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**`--langs` 옵션**: 쉼표로 구분된 대상 언어 코드 목록이에요. 언어 입력 프롬프트를 건너뛰고 각 언어에 대한 기본 레지스터 프리셋을 적용해요. 완전히 비대화형으로 설정하려면 `--yes`과 함께 사용하세요.

**언어 프리셋**: 대상 언어를 입력하라는 메시지가 표시될 때 프리셋 이름을 입력할 수 있어요:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

프리셋과 개별 코드를 혼합할 수 있어요: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

모든 로케일 파일에서 누락되거나 오래된 키, 그리고 폴백(fallback) 키를 번역해요.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry                             # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
```

**변경 사항 감지**: rosetta는 `.i18n-rosetta.lock`에 SHA-256 해시를 저장해요. 소스 값이 변경되면 다음 동기화 시 해당 키를 자동으로 다시 번역해요. 모든 개발자가 기준선을 공유할 수 있도록 잠금 파일(lock file)을 커밋하세요.

---

## watch

소스 로케일 파일이 변경될 때 자동으로 동기화해요. `Ctrl+C`로 중단할 때까지 실행돼요.

```bash
i18n-rosetta watch
```

---

## audit

번역되지 않은 `[EN]` 접두사가 붙은 폴백 값을 모두 나열해요. 하나라도 발견되면 종료 코드 1을 반환하므로, 불완전한 번역이 있을 때 빌드를 실패하게 만드는 CI 게이트로 사용하세요.

```bash
i18n-rosetta audit
```

---

## lint

i18n 번역 호출을 사용해야 하는 하드코딩된 사용자 노출 문자열이 있는지 소스 코드를 스캔해요. 사용 중인 프레임워크(next-intl, react-i18next, vue-i18n, Hugo)를 자동으로 감지해요.

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**감지 대상:**
- JSX 텍스트, `placeholder`, `alt`, `aria-label`, `title` 내의 하드코딩된 문자열
- 사용자 노출 콘텐츠가 있지만 i18n 프레임워크를 임포트(import)하지 않은 파일
- 데드 키(Dead keys) — 어떤 소스 파일에서도 참조하지 않는 로케일 키
- 커버리지 점수 — i18n을 거치는 문자열의 비율

**제외 대상**: 프로젝트 루트에 `.rosettaignore` 파일을 생성하세요 (`.gitignore`와 같은 glob 패턴 사용).

---

## wrap

`lint`가 감지한 하드코딩된 문자열을 `t()` 호출로 자동 래핑(wrap)해요. 파일을 수정하기 전에 자동으로 백업을 생성해요.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**안전 장치:**
1. Git-clean 확인 (dry-run에서는 건너뜀)
2. `.rosetta-backup/`에 자동 백업
3. 각 파일 쓰기 전 Diff 미리보기
4. 백업에서 복원하기 위한 `--undo` 지원

---

## seo

다국어 사이트를 위한 SEO 아티팩트를 생성해요.

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| 하위 명령어 | 출력 |
|------------|--------|
| `hreflang` | `<link rel="alternate" hreflang>` 태그 |
| `sitemap` | 다국어 `sitemap.xml` |
| `jsonld` | JSON-LD WebSite 언어 스키마 |

---

## integrity

번역된 로케일 파일의 손상 및 변형(drift)을 감지해요.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**확인 항목:**
- 자리 표시자(Placeholder) 손상 (예: 소스에는 `{name}`이 있지만 대상에는 누락됨)
- 인코딩 문제 (글자 깨짐, 잘못된 유니코드)
- 번역되지 않은 복사본 (대상 값이 소스와 동일함)
- 고립된 키(Orphaned keys) (대상에는 있지만 소스에는 없는 키)

---

## status

페어 구성, 설치된 플러그인, 품질 등급 및 벤치마크 점수를 보여줘요.

```bash
i18n-rosetta status
```

---

## provenance

설치된 모든 플러그인의 번역 리소스 라이선스 감사를 수행해요.

```bash
i18n-rosetta provenance
```

---

## plugin

번역 방식 플러그인을 관리해요. 플러그인은 `.rosetta/methods/`에 설치되는 사전 패키징된 번역 레시피예요.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

플러그인 매니페스트 형식은 [플러그인 사양](/docs/reference/plugin-spec)을 참조하세요.

---

## 3계층 파이프라인

완벽한 i18n을 위해 `lint`, `sync`, `audit`를 함께 사용하세요:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| 계층 | 명령어 | 시점 | 목적 |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | 하드코딩된 문자열이 포함된 커밋 차단 |
| **Sync** | `sync` | Post-commit / CI | 누락되거나 변경된 키 번역 |
| **Audit** | `audit` | 빌드 단계 | 불완전한 로케일이 있는 경우 배포 실패 처리 |

---

## 참고 항목

- [설정](/docs/getting-started/configuration) — 설정 파일 레퍼런스
- [번역 방식](/docs/guides/translation-methods) — 페어별 방식 선택
- [플러그인 사양](/docs/reference/plugin-spec) — 플러그인 매니페스트 형식
- [CI/CD 가이드](/docs/guides/ci-cd) — 파이프라인에서 CLI 명령어 자동화
- [동기화 작동 방식](/docs/concepts/how-sync-works) — 동기화 파이프라인 이해
- [품질 게이트](/docs/concepts/quality-gate) — 번역 유효성 검사 방법