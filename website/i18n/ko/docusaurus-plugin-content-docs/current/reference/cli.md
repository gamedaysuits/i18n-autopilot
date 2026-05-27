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
i18n-rosetta fonts <sub>       Download web fonts for PUA script converters
i18n-rosetta tm <sub>          Manage Translation Memory cache (stats, clear)
i18n-rosetta xliff <sub>       Export/import XLIFF 1.2 for professional review
```

특정 명령어에 대한 자세한 도움말을 보려면 `i18n-rosetta <command> --help`을 실행해 보세요.

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
--dry, --dry-run        Preview changes without writing files
--concurrency <n>       Max parallel API calls for content translation (default: 12)
--force-content         Re-translate all content files (clears content lock)
--force-keys <keys>     Comma-separated dot-notation keys to force re-translate
--no-tm                 Skip Translation Memory cache for this sync run
--locale <code>         Target locale (xliff export, tm clear)
```

---

## init

`i18n-rosetta.config.json` 파일을 생성하는 대화형 설정 마법사예요. 소스 로케일, 대상 언어, 파일 형식 및 번역 모델 설정을 안내해 줘요.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**`--langs` 옵션**: 쉼표로 구분된 대상 언어 코드 목록이에요. 언어 선택 프롬프트를 건너뛰고 각 언어에 대한 기본 register 프리셋을 적용해요. 완전히 비대화형으로 설정하려면 `--yes` 옵션과 함께 사용해 보세요.

**언어 프리셋**: 대상 언어를 묻는 프롬프트가 나타날 때 프리셋 이름을 입력할 수 있어요:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

프리셋과 개별 코드를 혼합할 수도 있어요: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

모든 로케일 파일에서 누락되거나 오래된 키, 그리고 fallback 키를 번역해요.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry-run                         # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --force-content                   # re-translate all Markdown/MDX
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --concurrency 20                  # 20 parallel API calls
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
i18n-rosetta sync --no-tm                            # skip cache, fresh API calls
```

**Translation Memory**: 기본적으로 `sync` 명령어는 `.rosetta/tm.json` 파일을 로드하여 변경되지 않은 소스 값에 대해 캐시된 번역을 제공해요. 캐시를 우회하려면 `--no-tm` 옵션을 사용해 보세요(번역 제공자를 변경하거나 품질을 디버깅할 때 유용해요). [Translation Memory](/docs/concepts/translation-memory) 문서를 참고해 보세요.

**변경 사항 감지**: rosetta는 `.i18n-rosetta.lock` 파일에 SHA-256 해시를 저장해요. 소스 값이 변경되면 다음 동기화 시 해당 키를 자동으로 다시 번역해요. 모든 개발자가 동일한 기준을 공유할 수 있도록 잠금(lock) 파일을 커밋해 주세요.

**병렬 처리**: 콘텐츠 번역(Markdown, MDX, 블로그 게시물)은 동시성 구성이 가능한 flat 작업 항목 풀에서 실행돼요. 기본값은 12개의 병렬 API 호출이에요. `--concurrency` 옵션이나 `concurrency` 설정 필드로 이 값을 재정의할 수 있어요. JSON 키 번역은 로케일별로 순차적으로 실행돼요(충분히 빠르기 때문에 병렬 처리가 주는 이점이 없어요).

---

## watch

소스 로케일 파일이 변경될 때 자동으로 동기화해요. `Ctrl+C`로 중단할 때까지 계속 실행돼요.

```bash
i18n-rosetta watch
```

---

## audit

번역되지 않은 `[EN]` 접두사가 붙은 모든 fallback 값을 나열해요. 하나라도 발견되면 종료 코드 1을 반환하며 종료돼요. 불완전한 번역이 있을 때 빌드를 실패하게 만드는 CI 게이트로 활용해 보세요.

```bash
i18n-rosetta audit
```

---

## lint

소스 코드를 스캔하여 i18n 번역 호출을 사용해야 하는 하드코딩된 사용자 대면 문자열을 찾아요. 사용 중인 프레임워크(next-intl, react-i18next, vue-i18n, Hugo)를 자동으로 감지해요.

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**감지 대상:**
- JSX 텍스트, `placeholder`, `alt`, `aria-label`, `title` 내의 하드코딩된 문자열
- 사용자 대면 콘텐츠가 있지만 i18n 프레임워크를 임포트하지 않은 파일
- Dead keys — 어떤 소스 파일에서도 참조하지 않는 로케일 키
- 커버리지 점수 — i18n을 거치는 문자열의 비율

**제외 대상**: 프로젝트 루트에 `.rosettaignore` 파일을 생성하세요(`.gitignore`와 같은 glob 패턴 사용).

---

## wrap

`lint` 명령어로 감지된 하드코딩된 문자열을 `t()` 호출로 자동 래핑(wrap)해요. 파일을 수정하기 전에 자동으로 백업을 생성해요.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**안전 장치:**
1. Git-clean 확인 (dry-run 시 건너뜀)
2. `.rosetta-backup/` 폴더에 자동 백업
3. 각 파일 쓰기 전 diff 미리보기
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
- Placeholder 손상 (예: 소스에는 `{name}`가 있지만 대상에는 누락된 경우)
- 인코딩 문제 (mojibake, 잘못된 유니코드)
- 번역되지 않은 복사본 (대상 값이 소스 값과 동일한 경우)
- Orphaned keys (대상에는 있지만 소스에는 없는 키)
- ICU MessageFormat 복수형 범주 완전성 (예: 아랍어는 6개의 범주가 필요함)

---

## tm

Translation Memory 캐시(`.rosetta/tm.json`)를 관리해요. TM은 이전 번역을 저장하고 이후 동기화 시 API를 호출하는 대신 저장된 번역을 제공해요.

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| 하위 명령어 | 출력 |
|------------|--------|
| `stats` | 항목 수, 파일 크기, 로케일별 세부 정보 |
| `clear` | 캐시 파일 삭제 (전체 또는 로케일별) |

| 옵션 | 효과 |
|--------|--------|
| `--locale <code>` | 특정 로케일의 항목만 지우기 |
| `--yes` | 확인 프롬프트 건너뛰기 |

TM의 작동 방식과 캐시를 지워야 하는 시기에 대해서는 [Translation Memory](/docs/concepts/translation-memory) 문서를 참고해 보세요.

---

## xliff

전문 번역가의 검토를 위해 XLIFF 1.2 파일을 내보내고 가져와요. XLIFF는 memoQ, SDL Trados, Phrase와 같은 CAT 도구에서 지원하는 범용 교환 형식이에요.

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| 하위 명령어 | 출력 |
|------------|--------|
| `export` | 소스 및 대상 로케일 파일에서 `.xliff` 생성 |
| `import` | 검토된 `.xliff` 번역을 로케일 파일에 병합 |

| 옵션 | 효과 |
|--------|--------|
| `--locale <code>` | 내보낼 대상 로케일 (필수) |
| `--out <path>` | 사용자 지정 출력 경로 또는 디렉터리 |
| `--dry` | 쓰기 없이 가져오기 미리보기 |

전체 워크플로우는 [Working with Professional Translators](/docs/guides/professional-translators) 문서를 참고해 보세요.

---

## status

페어 구성, 설치된 플러그인, 품질 계층(quality tiers) 및 벤치마크 점수를 표시해요.

```bash
i18n-rosetta status
```

---

## provenance

설치된 모든 플러그인에 대한 번역 리소스 라이선스를 감사(audit)해요.

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

플러그인 매니페스트 형식은 [Plugin Specification](/docs/reference/plugin-spec) 문서를 참고해 보세요.

---

## fonts

인공어(constructed language) 스크립트 변환기를 위한 PUA 웹 폰트를 다운로드하고 관리해요. Private Use Area 문자를 사용하는 언어(Klingon, Sindarin, Kryptonian)는 스크립트를 렌더링하기 위해 맞춤형 웹 폰트가 필요해요. 이 명령어는 검증된 오픈 소스 저장소에서 해당 폰트를 다운로드해요.

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| 하위 명령어 | 출력 |
|------------|--------|
| `list` | 필요한 PUA 폰트와 설치 상태 표시 |
| `install` | 구성된 언어의 폰트 다운로드 |

| 옵션 | 효과 |
|--------|--------|
| `--dir <path>` | 폰트 출력 디렉터리 재정의 (프로젝트 유형에서 자동 감지됨) |
| `--css` | 폰트와 함께 `conlang-fonts.css` 스니펫 생성 |
| `--config <path>` | 구성 파일 경로 (폰트가 필요한 언어를 감지하는 데 사용됨) |

**자동 감지:** 출력 디렉터리는 프로젝트 구조에서 유추돼요:
- **Docusaurus** → `static/fonts/` 또는 `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **기본값** → `public/fonts/`

**네이티브 유니코드 변환기**(`crk` → Cree Syllabics, `sr` → Serbian Cyrillic)는 폰트 설치가 필요하지 않아요.

PUA 폰트에 대한 자세한 내용은 [Conlangs, Scripts & Orthography](/docs/guides/conlangs-scripts-orthography) 문서를 참고해 보세요.

## 3계층 파이프라인

완벽한 i18n을 위해 `lint`, `sync`, `audit` 명령어를 함께 사용해 보세요:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| 계층 | 명령어 | 시기 | 목적 |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | 하드코딩된 문자열이 포함된 커밋 차단 |
| **Sync** | `sync` | Post-commit / CI | 누락되거나 변경된 키 번역 |
| **Audit** | `audit` | 빌드 단계 | 불완전한 로케일이 있는 경우 배포 실패 처리 |

---

## 참고 항목

- [Configuration](/docs/getting-started/configuration) — 구성 파일 레퍼런스
- [Translation Methods](/docs/guides/translation-methods) — 페어별 번역 방식 선택
- [Translation Memory](/docs/concepts/translation-memory) — 캐싱 및 비용 절감
- [Working with Professional Translators](/docs/guides/professional-translators) — XLIFF 워크플로우
- [Plugin Specification](/docs/reference/plugin-spec) — 플러그인 매니페스트 형식
- [CI/CD Guide](/docs/guides/ci-cd) — 파이프라인에서 CLI 명령어 자동화
- [How Sync Works](/docs/concepts/how-sync-works) — 동기화 파이프라인 이해하기
- [Quality Gate](/docs/concepts/quality-gate) — 번역 유효성 검사 방법