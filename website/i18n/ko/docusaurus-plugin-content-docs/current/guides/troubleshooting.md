---
sidebar_position: 6
title: "문제 해결"
---
# 문제 해결

i18n-rosetta의 일반적인 문제와 해결 방법을 안내해요.

## API 및 인증

### "OPENROUTER_API_KEY not found"

Rosetta에서 LLM 번역을 사용하려면 API 키가 필요해요. 환경 변수로 설정해 주세요:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

또는 `.env` 파일에 설정할 수도 있어요(프로젝트에서 `.env` 파일을 로드하는 경우):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
Google Translate API 키만 있는 경우, rosetta가 이를 자동 감지하여 Google Translate를 기본 메서드로 사용해요. 별도의 설정 변경은 필요하지 않아요.
:::

### OpenRouter의 "401 Unauthorized" 오류

API 키가 유효하지 않거나 만료되었어요. [openrouter.ai/keys](https://openrouter.ai/keys)에서 확인해 주세요.

### "429 Too Many Requests" / 속도 제한(Rate Limiting)

Rosetta는 지수 백오프(exponential backoff)를 사용하여 내부적으로 속도 제한을 처리해요. 속도 제한에 계속 걸린다면 다음을 시도해 보세요:

1. 설정에서 **배치 크기(batch size)를 줄여보세요**:
   ```json
   { "batchSize": 15 }
   ```
2. **속도 제한이 더 높은 모델을 사용해 보세요** (예: `google/gemini-3.5-flash` 모델은 제한이 넉넉해요)
3. 대량의 언어 쌍에는 **더 저렴하고 빠른 메서드를 사용해 보세요** — Google Translate는 속도 제한이 없어요:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### 모델을 찾을 수 없음 / 404 오류

직접 연결하는 LLM 제공자(`openai`, `anthropic`, `gemini`)는 처음 사용할 때 모델 문자열을 검증해요. 다음과 같은 경고가 표시될 수 있어요:

**"looks like an OpenRouter path"** — 직접 연결 제공자에 OpenRouter 형식의 모델(`google/gemini-3.5-flash`)을 사용하고 있어요. 직접 연결 제공자는 순수 모델 이름만 사용해요:

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

또는 `llm` 메서드로 전환하여 OpenRouter를 사용해 보세요:
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — 잘못된 제공자에게 모델을 보내고 있어요:

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — 모델이 더 이상 사용되지 않거나 철자가 틀렸을 수 있어요. Rosetta는 제공자의 실시간 모델 목록을 가져와 대안을 제안해 줘요. 현재 사용 가능한 모델 이름은 제공자의 문서를 확인해 주세요.

:::tip 모델 지원 중단이 발생할 수 있어요
제공자들은 정기적으로 모델 이름을 폐기해요. 제공자 업데이트 후 번역이 갑자기 실패한다면 `[WARN]` 출력을 확인해 보세요. 현재 사용 가능한 대안을 보여줄 거예요.
:::

## 번역 품질

### 번역이 출발어(Source language)를 그대로 따라 하는 경우

품질 게이트(Quality gate)가 이를 잡아내요. 번역이 영어 원문과 동일하면 거부되고 다시 시도돼요. 이 문제가 계속 발생한다면:

1. **모델을 확인해 보세요** — 일부 모델은 특정 언어 쌍에서 성능이 떨어질 수 있어요.
2. **어조(Register) 지침을 추가해 보세요** — 모델에게 어떤 언어로 생성해야 하는지 알려주세요:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **다른 모델을 시도해 보세요** — `gpt-4o-mini`에서 `gpt-4o` 또는 `google/gemini-2.5-pro`로 변경해 보세요.

### 잘못된 문자 출력 (예: 일본어에 라틴 문자 사용)

품질 게이트의 문자 규정 준수 검사가 대부분의 경우를 잡아내요. 이 문제가 계속 발생한다면:

- 로케일 코드가 올바른지 확인해 주세요(`jp`가 아닌 `ja`).
- `register` 필드에 명시적인 문자 지침을 추가해 보세요:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### 출력에 환각(Hallucination) 패턴이 나타나는 경우

반복되는 트라이그램(trigram) 패턴(예: "hello hello hello")은 환각 루프 감지기에서 잡아내요. 출력이 깨졌는데도 감지기를 통과한다면:

1. **배치 크기를 줄여보세요** — 배치가 작을수록 더 집중된 출력을 생성해요.
2. **더 강력한 모델을 사용해 보세요** — 큰 모델일수록 비라틴 문자에서 환각이 덜 발생해요.
3. **코칭 데이터를 추가해 보세요** — 사전 용어가 번역의 기준점이 되어줘요.

## 파일 및 형식 문제

### "No locale files found" (로케일 파일을 찾을 수 없음)

Rosetta는 로케일 파일을 자동으로 감지해요. 파일을 찾을 수 없다면:

1. **`localesDir` 설정을 확인해 보세요** — 로케일 파일이 있는 디렉터리를 가리켜야 해요:
   ```json
   { "localesDir": "./locales" }
   ```
2. **파일 이름을 확인해 보세요** — 파일 이름은 로케일 코드(예: `en.json`, `fr.json` 등)로 지정되어야 해요.
3. **형식을 확인해 보세요** — 지원되는 형식: JSON, 중첩된 JSON, YAML, TOML

### 잠금 파일(Lock file) 충돌

`.i18n-rosetta.lock` 파일이 잘못된 상태가 된 경우:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
잠금 파일을 삭제하면 다음 동기화 시 변경된 키뿐만 아니라 모든 키를 다시 번역하게 돼요. 대규모 프로젝트의 경우 API 비용이 발생할 수 있으니 주의해 주세요.
:::

### 특정 키 다시 번역하기

개별 번역이 잘못되어 잠금 파일을 삭제하지 않고 강제로 다시 번역하고 싶다면:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

`--force-keys` 플래그는 해당 특정 키에 대한 잠금 파일 해시 검사를 무시하고, 다른 키에는 영향을 주지 않으면서 강제로 다시 번역을 수행해요.

### 콘텐츠 번역 시 코드 블록이 손상되는 경우

이런 일은 발생하지 않아야 해요. 코드 블록은 번역 전에 보호(shield)되거든요. 만약 이런 문제가 발생한다면:

1. 코드 블록이 표준 펜싱(백틱 3개)을 사용하는지 확인해 주세요.
2. 원본 Markdown에 닫히지 않은 코드 블록이 있는지 확인해 주세요.
3. 이슈를 등록해 주세요 — 이는 센티널 보호 시스템(sentinel shielding system)의 버그예요.

## CLI 문제

### `--watch` 명령이 변경 사항을 감지하지 못하는 경우

파일 감시 기능은 Node.js의 기본 `fs.watch`을 사용해요. 알려진 문제는 다음과 같아요:

- **네트워크 드라이브** — `fs.watch`은 NFS/SMB 마운트에서 안정적으로 작동하지 않아요.
- **Docker 볼륨** — 폴링(polling) 모드를 사용하거나 컨테이너 내부에서 rosetta를 실행해 주세요.
- **대규모 디렉터리** — 감시기는 `localesDir`를 재귀적으로 모니터링하므로, 트리가 너무 깊으면 OS 제한을 초과할 수 있어요.

### `npx` 명령이 이전 버전을 실행하는 경우

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

또는 전역으로 설치해 보세요:

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## 성능

### 여러 언어 동기화가 느린 경우

Rosetta는 기본적으로 언어 쌍을 순차적으로 번역해요. 다국어 동기화 속도를 높이려면:

1. **대량의 언어 쌍에는 Google Translate를 사용해 보세요** — LLM 번역보다 10~50배 더 빨라요.
2. **배치 크기를 늘려보세요** (최대 50, 기본값은 30):
   ```json
   { "batchSize": 50 }
   ```
3. **빠른 모델을 사용해 보세요** — `gpt-4o-mini` 모델이 `gpt-4o` 모델보다 훨씬 빨라요.

### 높은 API 비용

- **배치 크기를 확인해 보세요** — 배치가 클수록 API 호출 횟수가 줄어들어 비용이 낮아져요.
- **번역 메모리(Translation Memory)를 사용해 보세요** — TM은 기본적으로 켜져 있어요. `i18n-rosetta tm stats` 명령을 실행하여 잘 작동하는지 확인해 보세요. 여러 번 동기화한 후에도 항목이 0개로 표시된다면 `.rosetta/` 디렉터리 권한에 문제가 있을 수 있어요.
- **프롬프트 캐싱을 사용해 보세요** — Rosetta는 Anthropic 및 Google 모델에서 캐시 적중률을 높이기 위해 시스템/사용자 메시지를 분리해요.
- **Tier 2 언어에는 Google Translate를 사용해 보세요** — [30개 언어 번역하기](/docs/tutorials/translate-30-languages) 쿡북을 참고해 주세요.

### 제공자 변경 후 이전 번역이 남아있는 경우

한 번역 메서드에서 다른 메서드로 전환할 때(예: `llm`에서 `deepl`로 변경), 원본 텍스트가 변경되지 않은 키에 대해서는 TM 캐시가 여전히 이전 메서드의 번역을 제공할 수 있어요. 캐시 키에 메서드 이름이 포함되어 있어 대부분의 경우는 자동으로 처리돼요. 하지만 동일한 메서드 내에서 `model` 설정을 변경했다면:

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

캐시 키 설계에 대한 자세한 내용은 [번역 메모리](/docs/concepts/translation-memory)를 참고해 주세요.

## 여전히 문제가 해결되지 않나요?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — 기존 이슈를 검색하거나 새 이슈를 등록해 주세요.
- **[아키텍처 문서](/docs/concepts/architecture)** — 시스템 설계를 이해하는 데 도움이 돼요.
- **[품질 게이트](/docs/concepts/quality-gate)** — 내부적으로 검증이 어떻게 작동하는지 확인할 수 있어요.