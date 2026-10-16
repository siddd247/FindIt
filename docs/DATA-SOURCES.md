# Catalogue expansion and source limits

Checked 2026-10-16. The working catalogue contains original sourced names plus `catalogue-expansion-2026-10.json`. The latter records model families, documented configurations and exact manufacturer SKUs separately. Existing owner records, administrator accounts and inventory are preserved. No shop stock is created by research imports.

## Manufacturer sources used

- Apple model history and each linked technical sheet: https://support.apple.com/en-in/108052 and https://support.apple.com/en-in/102869. Explicit M2 and M3 history exceptions cover older requested Macs as well as current M4/M5 families. These are not every build-to-order RAM/storage/colour combination. No nonexistent chip/screen-size combination is generated.
- HP India current Victus catalogue and seven linked SKU sheets: https://www.hp.com/in-en/shop/listings/laptops?subbrand=victus-by-hp. Six listed in stock and one out of stock on HP's online site during research; neither status is copied to Jammu shops. The dataset records CPU, memory, storage, GPU, screen and manufacturer SKU from the matched source. Manufacturer prices are not shop quotes.
- Samsung India newsroom, product specifications and buying tools: https://news.samsung.com/in/ and https://www.samsung.com/in/smartphones/galaxy-z-fold7/buy/. Three Fold7 memory/storage combinations are explicitly documented. Firmware support lists establish model existence, not whether models are still sold.
- OPPO India catalogue: https://www.oppo.com/in/smartphones/. Names are imported; dynamic out-of-stock placeholders, missing prices and general filter combinations are not treated as reliable inventory/configuration evidence.
- Lenovo India product pages, Acer's specified regional product page, Xiaomi India, realme India and Samsung India appliance sources are listed per group in the manifest. Acer's Canadian SKU is clearly described as regional, with India distribution unconfirmed.
- Additional shop sources: Reliance's official indexed Jewel Chowk and Kunjwani store pages. Full Jewel page could not be retrieved; unknown phone/hours stay empty. See `shop-research.json` and the CSV for provenance.

## Bulk catalogue provider researched

Open Icecat is a relevant licensed bulk-content option:

- https://icecat.com/content-subscription/
- https://icecat.com/structured-data-content-users/
- https://iceclog.com/wp-content/uploads/2018/12/Open-Catalog-Interface.pdf

The free Open Icecat catalogue covers participating/sponsoring brands. Full Icecat is a separate paid offering with broader coverage. Register a content-user account and review the provider's current content licence/access policy before downloading a feed. Some images and rich media have additional access restrictions. No account was created, terms accepted, payment made or credential invented. No complete Icecat feed was downloaded in this workspace. A provider subscription would still not establish inventory at a Jammu shop.

Comparison-site pages and arbitrary Kaggle/scraped datasets are not assumed to be complete, current, accurate, licensed for redistribution, or store-stock evidence. Do not copy large descriptive text/images without their usage permissions. A larger feed should provide brand, manufacturer part number/GTIN, variant, release date, factual specs, regional scope, source URL, check date and licence. Import in reviewed batches; never produce configuration cross-products from independent filter options.

Additional dataset research:

- https://github.com/abhinavflac/laptops-specs-dataset advertises 992 laptop records as of December 2025. Its README claims CC0, while the checked LICENSE file is MIT. It uses comparison-site scraped data and lacks reliable release-date coverage for the full two-year window. Keep it for review rather than publishing its prices, ratings or configurations as manufacturer-verified data.
- https://www.kaggle.com/datasets/utsh0dey/global-mobile-phone-specifications-and-prices advertises 6,620 devices and 168 columns. The readable page did not expose enough data/licence/download detail to validate a bulk import.
- https://huggingface.co/datasets/Nadirova/Phone_SpecsDataset_25K advertises a roughly 443 MB JSON dataset; its card could not be retrieved reliably, and source/licence/quality remain unverified.

`node scripts/download-laptop-research.mjs` attempts data/text-only downloads into `.local/research-datasets/` with size limits and checksums, and never executes repository code or imports inventory. The attempted downloads in this restricted agent session all failed with `EACCES`; `.local/research-datasets/download-report.json` records that result. No bulk feed was downloaded or imported. The script can be run from a normal terminal with network access.

## Run this researched batch

```powershell
node scripts/backup-db.mjs
node scripts/expand-catalogue.mjs
node scripts/expand-catalogue.mjs --apply
node scripts/apply-shop-research.mjs
```

Dry-run validates official hosts, release years and duplicate keys. Any row error blocks product writes. Repeating an applied batch adds no duplicates. The import explicitly rejects `stock`, `shop_id` and `price` fields. Use owner inventory entry or admin Field Agent mode for a genuine direct shop confirmation.

## What to obtain from a shop

Confirm the operating shop name, street address/map pin, public contact and opening hours, and who is authorized to update it. For inventory obtain the exact model/variant, new or refurbished condition, actual quoted INR/USD price or range, optional quantity, stock status and when/by whom it was checked. Do not request customer details, private IDs or payment information. Do not treat global availability as local availability. The present listing form does not have a separate condition field; clarify condition directly with the shop until that field is implemented.
