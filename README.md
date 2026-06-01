# Research Reports Portal

A lightweight, high-performance static portal to index and search hosted research reports from the Data Science group at the University of Turku.

## How it Works

The portal is a pure static single-page application (SPA) consisting of:
* `index.html` — The structural layout.
* `reports.css` — Modern, responsive style system (uses a native system font stack for 0ms font-loading overhead).
* `reports.js` — Client-side scripts to handle search, year filtering, pagination, and dynamic rendering.
* `reports.json` — The data source containing all report metadata.

Since the listing is populated dynamically by fetching `reports.json` at runtime, **you do not need to edit any HTML, CSS, or JS files to add or update reports.** You only need to edit `reports.json`.

---

## How to Add a New Report

To add a new report to the dashboard, open [reports.json](reports.json) and append a new JSON object to the main list. 

### Example Object Structure

```json
  {
    "key": "example-report",
    "title": "Maternal Prenatal Diet & Child Metabolomics",
    "summary": "Association analysis between maternal prenatal diet exposures in early/late pregnancy and child metabolite outcomes across infancy and childhood.",
    "visibility": "Protected",
    "updated": "2026-04-22",
    "area": "Maternal & Child Health",
    "authors": ["Muluh G", "Kaya Kacar H", "Mongad DS", "Laitinen K", "Lahti L"],
    "tags": ["metabolomics", "pregnancy", "diet", "longitudinal"],
    "reportUrl": "/reports/example-report/",
    "githubUrl": "https://github.com/0xMuluh/fopp-example",
    "manuscript": { "label": "Manuscript draft" }
  }
```

### Fields Guide

| Field | Type | Description |
| :--- | :--- | :--- |
| `key` | String | A unique identifier for the report (e.g. `"husna"`). |
| `title` | String | The official title of the publication/report. |
| `summary` | String | A brief summary or description of the research. |
| `visibility` | String | Access level: `"Protected"` or `"Public"`. |
| `updated` | String | Date updated in `YYYY-MM-DD` format (used dynamically for sorting and filtering by year). |
| `area` | String | The research area or topic categorization (e.g., `"Child Health"`). |
| `authors` | Array of Strings | Author list formatted as `["Lastname Initial", ...]`. Listed in the citation. |
| `tags` | Array of Strings | Keywords/tags used for search indexing and pill badges. |
| `reportUrl` | String | Relative or absolute path where the static report files are served (e.g. `"/reports/husna/"`). |
| `githubUrl` | String | *Optional.* Link to the Git repository containing the report source code. |
| `manuscript`| Object | *Optional.* Structure: `{"label": "Manuscript draft"}` or `{"label": "Published article (DOI)", "url": "https://doi.org/..."}`. |
| `draft` | Boolean | *Optional.* Set to `true` to hide the report from production view. |

---

## Hiding/Drafting Reports

If you want to keep a report entry in the `reports.json` file but prevent it from showing up in the production listing, simply set `"draft": true` on that object.
