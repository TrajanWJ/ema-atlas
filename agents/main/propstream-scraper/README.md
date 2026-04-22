# PropStream Scraper Scaffold

This folder contains a Tampermonkey-first extraction scaffold for pulling lead list data from PropStream into a normalized format for the real estate agent system.

## Goal
Extract lead rows from PropStream list/search pages into CSV/JSON that can feed:
- Opportunity Intake Agent
- Lead Enrichment Agent
- Strategy Router Agent
- Seller Motivation Scoring Agent

## Current state
- `tampermonkey-v1.user.js` is a generic scaffold.
- It is intentionally selector-light until we see the real PropStream DOM.

## What we still need from the operator
1. The exact PropStream page where the target leads appear
2. Which fields are visible in the table/card view
3. Desired output format:
   - CSV
   - JSON
   - both
4. Whether pagination should auto-advance
5. Whether to capture only visible rows or all pages

## Recommended next step
Open the target PropStream results page and send:
- screenshot of the table/cards
- or pasted HTML snippet of one result row/card
- or page URL pattern + visible columns

Then we will tighten selectors and ship a working extractor.
