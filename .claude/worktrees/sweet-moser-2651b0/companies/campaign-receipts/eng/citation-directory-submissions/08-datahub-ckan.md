# DataHub.io (CKAN-based, Open Knowledge Foundation)

**Status:** TODO-HUMAN
**Date attempted:** 2026-05-19
**Submission target:** https://datahub.io/dataset/new

## Why TODO-HUMAN

DataHub's `/dataset/new` flow requires a GitHub-OAuth login (their account
creation routes through GitHub). Founder needs to authenticate once; after
that, the dataset upload itself is straightforward.

## Dataset to publish

Title: **Trump 2016 Campaign Promises — Graded**
License: CC-BY-4.0
Format: JSON corpus from `/api/promises?cycle=trump-2016`
Description: 145 promises, 46 KEPT / 51 PARTIAL / 40 BROKEN / 8 READER-DECIDES,
81 linking to primary source URLs.

## Auxiliary

Once published, the DataHub URL becomes a permanent backlink. CKAN data
catalogs federate, so a DataHub listing also surfaces in downstream CKAN
search indexes.
