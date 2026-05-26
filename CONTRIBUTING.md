# Contributing

> To contribute to this project you will need to download the [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness). The eval harness is where translation methods are developed, benchmarked, and validated before being deployed through i18n-rosetta.

Thank you for your interest in contributing to the Rosetta translation ecosystem. This is a project about building machine translation for languages that commercial services will never support — and we need many different kinds of help.

## Ways to Contribute

### If you speak a low-resource language

You don't need to be a programmer. You are the most valuable contributor we have.

- **Build reference translations**: We need curated parallel text pairs for benchmarking. If you speak English and a low-resource language, you can create the ground truth that all methods are evaluated against.
- **Review translations**: Every method that claims to produce working translations needs human validation. Bilingual speakers review outputs and tell us whether the computer got it right — and more importantly, *why* it got it wrong.
- **Write coaching data**: Grammar rules, dictionary entries, morphological patterns — these are the linguistic resources that make translation methods work. Your knowledge of how your language works is irreplaceable.

See the [Evaluation Datasets](https://mtevalarena.org/docs/leaderboard/datasets) for the corpus format and quality requirements.

### If you're an ML engineer or researcher

- **Build a translation method**: Implement the `TranslationProcess` protocol and benchmark it against standardized corpora. The interface is simple: `async translate(entries, config) → [{id, predicted}]`. What happens inside your method is up to you.
- **Improve metrics**: The composite scoring system has known limitations. Better metrics for morphologically rich languages are an open research question.
- **Run benchmark sweeps**: Systematic evaluation across models, prompts, and configurations produces data that benefits the whole community.

See the [FST-Gated Pipeline tutorial](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) for a step-by-step example.

### If you're a developer

- **Improve the tooling**: The eval harness and i18n-rosetta are both open source. Bug fixes, performance improvements, and new features are welcome.
- **Add language support**: Language cards, script converters, and method integrations all need to be built for each new language. See the [Supported Languages](https://i18n-rosetta.com/docs/reference/supported-languages) reference.
- **Build the infrastructure**: Cryptographic test set encryption, community review interface, leaderboard — much of the planned infrastructure hasn't been built yet.

### If you represent a language community or governance organization

- **Partner with us on key custody**: We're building cryptographic data sovereignty into the benchmark infrastructure. Governance organizations hold the encryption keys for evaluation datasets. See the [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty) guide.
- **Set terms for benchmark participation**: The legal framework for method ownership transfer needs to be developed in partnership with communities.

## Getting Started

### Prerequisites

1. **Clone both repositories**:
   ```bash
   git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
   git clone https://github.com/gamedaysuits/i18n-rosetta.git
   ```

   Read the [Bridge Guide](https://i18n-rosetta.com/docs/guides/bridge) to understand how these two repos work together.

2. **Set up the eval harness** (Python 3.10+):
   ```bash
   cd gds-mt-eval-harness
   pip install -e .
   ```

3. **Set up i18n-rosetta** (Node.js 20+):
   ```bash
   cd i18n-rosetta
   npm install
   npm link  # makes the CLI available globally
   ```

### Running Tests

```bash
# i18n-rosetta
npm test

# Eval harness
pytest
```

### Code Style

- **JavaScript**: No build step, no TypeScript, no bundler. Pure ES modules with JSDoc types.
- **Python**: Standard Python conventions. Type hints encouraged.
- **Comments**: Explain *why*, not *what*. Every non-obvious decision should have a comment.
- **Commits**: Descriptive commit messages. Reference issues where applicable.

## Submitting Changes

1. Fork the relevant repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes with tests
4. Run the test suite and ensure it passes
5. Submit a pull request with a clear description

For method submissions to the leaderboard, see the [Leaderboard Rules](https://mtevalarena.org/docs/leaderboard/rules).

## Code of Conduct

We are building technology for language communities. Respect for those communities — their data, their governance, their decisions — is non-negotiable. Extractive behavior (scraping community language resources, publishing translations without consent, training models on community data without agreement) is grounds for immediate removal from the project.

## Questions?

Open an issue or start a discussion. We're happy to help you find where your skills can have the most impact.
