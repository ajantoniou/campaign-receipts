# Hugging Face Datasets

**Status:** TODO-HUMAN
**Date attempted:** 2026-05-19
**Submission target:** https://huggingface.co/new-dataset

## Why TODO-HUMAN

Hugging Face dataset publishing requires a HF account + CLI auth token.
Founder should create a CR org on HF, then push the Trump-2016 seed JSON
corpus.

## Plan

1. `huggingface-cli login` (founder creates HF account if missing)
2. `huggingface-cli repo create campaign-receipts/trump-2016 --type dataset`
3. Export from `/api/promises?cycle=trump-2016` → `trump-2016.jsonl`
4. `dataset_infos.json` + `README.md` with CC-BY-4.0 license + CR backlink
5. `git push` to the HF remote

Each researcher who downloads the dataset is a citation prospect.
