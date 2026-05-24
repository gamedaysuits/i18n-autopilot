---
slug: v3-2-quality-infrastructure
title: "v3.2.0: 産業グレードの品質インフラ"
authors: [curtisforbes]
tags: [release]
date: 2026-05-14
---
v3.2.0は品質重視のリリースです。702のテスト、163のテストスイートを備え、サイレントエラーを一切許容しません。

<!-- truncate -->

## 変更内容

### Quality Gate (5つのチェック)

すべての翻訳は、ディスクに書き込まれる前に5つの決定論的な検証チェックを通過するようになりました。

1. **Empty/blank** — モデルが何も返さない
2. **Source echo** — モデルが英語の入力をそのまま返す
3. **Hallucination loop** — トライグラムパターンの繰り返し
4. **Length inflation** — 出力がソースの4倍以上の長さ
5. **Script compliance** — ロケールに対して不適切な文字体系

これら5つのチェックすべてに合格しない限り、翻訳は書き込まれません。失敗した翻訳はログに記録され、再試行されます。

### リトライカスケード

バッチが失敗した場合、rosettaはバッチサイズを段階的に小さくして再試行します。

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the problem keys
```

### セキュリティの強化

- **Prototype pollution guard** — パース時に `__proto__`、`constructor` キーを拒否
- **Path traversal guard** — 細工されたロケールコードによる設定ディレクトリ外への書き込みを防止
- **Response validation** — 送信したキーのみをレスポンスとして許可

### テストインフラストラクチャ

| スイート | テスト数 | テスト対象 |
|-------|-------|---------------|
| Core (8スイート) | 280+ | Config、sync、CLI、watch、audit、pairs、format、init |
| Red team | 89 | 敵対的入力、エンコーディング攻撃 |
| Contract | 120 | API統合コントラクト |
| Performance | 36 | バッチ最適化、スループットの低下（リグレッション） |
| Coverage | 計702 | パイプライン全体 |

### プロンプトキャッシング

システムメッセージがユーザーメッセージから分割されるようになり、AnthropicやGoogleなどのプロバイダーでプロンプトキャッシュのヒットが可能になりました。これにより、マルチバッチ同期におけるトークンコストが大幅に削減されます。

技術的な詳細については、[Quality Gateのドキュメント](/docs/concepts/quality-gate)および[セキュリティのドキュメント](/docs/concepts/security)をご覧ください。