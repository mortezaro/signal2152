# Product Notes

## Goal

Build a visually distinctive market dashboard that merges:

- broad Yahoo Finance data coverage
- our own alpha model outputs
- strong design and discoverability

without any chat or LLM layer.

## Core screens to add next

1. Ticker detail page
2. Sector heatmap
3. Model run comparison page
4. Portfolio construction view
5. Regime diagnostics page

## Differentiators

- not an MCP utility
- not a broker-terminal clone
- not only a charting app
- it is a research and monitoring surface for model-informed equity idea generation

## Model hooks

The backend should keep model integration file-based and simple:

- `predictions.csv`
- `metrics.json`
- `model_summary.json`

That makes it easy to swap in:

- starter-universe model
- large-universe model
- market-context model
- future regime-aware variants
