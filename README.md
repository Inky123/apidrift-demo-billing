# apidrift demo: billing service

A small subscription billing service in Node and Python, written against Stripe's
`2026-08-26.dahlia` API. Stripe's `2026-09-30.endive` release changed three of the
calls it makes. Installing [apidrift-check](https://github.com/apps/apidrift-check)
on this repository opens an issue listing the affected lines and a pull request
with the documented fixes.
