# Runtime Setup

Systém umí běžet ve dvou režimech:

1. `Demo režim`
Použije se automaticky, když nejsou nastavené `SUPABASE_URL` a `SUPABASE_SERVICE_ROLE_KEY`.
Data se ukládají do lokálního souboru `.data/demo-store.json`.

2. `Produkční režim`
Aktivuje se automaticky po doplnění Supabase envů.

## Povinné proměnné pro produkci

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
APP_BASE_URL=
```

## Volitelné proměnné

```bash
OFFER_EXPIRY_MINUTES=10
```

## Co nasadit do Supabase

1. aplikovat SQL migraci:

`/supabase/migrations/20260603_initial_dispatch_schema.sql`

2. doplnit produkční malíře do tabulky `painters` nebo nechat první seed proběhnout automaticky přes API

## Hlavní cesty aplikace

- veřejný web: `/`
- admin dispečink: `/admin`
- nabídka pro malíře: `/nabidka?token=...`
- stav zakázky klienta: `/zakazka?token=...`

## Hlavní API cesty

- `POST /api/public/jobs`
- `GET /api/public/job?token=...`
- `POST /api/public/job-complete`
- `POST /api/public/job-cancel`
- `POST /api/admin/login`
- `GET /api/admin/session`
- `GET /api/admin/jobs`
- `GET /api/admin/job?id=...`
- `POST /api/admin/job-action`
- `GET /api/admin/painters`
- `GET /api/painter/offer?token=...`
- `POST /api/painter/respond`
