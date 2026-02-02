# Vendor libraries required for APKG export (MV3 compliant)

Edge/Chrome (Manifest V3) does **not** allow loading scripts from CDNs in extension pages.
So APKG export must use **local** copies.

## Step-by-step

1) Create folder `vendor/` (same level as `manifest.json`).

2) Download these 3 files and put them into `vendor/`:

- `vendor/jszip.min.js`
  - https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js

- `vendor/sql-wasm.js`
  - https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js

- `vendor/sql-wasm.wasm`
  - https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm

3) Reload the unpacked extension.

If you prefer PowerShell:
- Invoke-WebRequest https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js -OutFile vendor/jszip.min.js
- Invoke-WebRequest https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js -OutFile vendor/sql-wasm.js
- Invoke-WebRequest https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm -OutFile vendor/sql-wasm.wasm
