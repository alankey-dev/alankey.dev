# Performance budget exceptions

Constitution Principle IV pins hard per-page budgets:

- Largest Contentful Paint at most 1.5 s on Slow-4G plus mid-tier mobile.
- Total JavaScript shipped per page at most 30 KB gzipped.
- Total CSS shipped per page at most 20 KB gzipped.
- Zero render-blocking third-party requests.
- All images AVIF or WebP with explicit width/height; hero images at most
  100 KB.

A change that breaks any budget MUST either be reverted or recorded here
with: the commit that introduced it, what budget it broke, why, and the
plan to remove the exception.

| Date | Commit | Budget broken | Reason | Plan to resolve |
|--|--|--|--|--|
| _none yet_ | | | | |
