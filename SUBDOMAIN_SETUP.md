# Subdomain Setup Guide

To use the merchant and customer portals on separate subdomains, follow these instructions.

## Subdomain Mapping
- **Merchant Panel**: `admin.yourdomain.com` (maps to `/admin`)
- **Customer Wallet**: `c.yourdomain.com` (maps to `/wallet` and `/c/[token]`)
- **POS Terminal**: `pos.yourdomain.com` (maps to `/pos`)

## Local Development (Testing)
To test this on your computer, you need to map these subdomains to `localhost`.

### On macOS/Linux:
1. Open your terminal.
2. Run `sudo nano /etc/hosts`.
3. Add the following lines:
   ```text
   127.0.0.1 admin.localhost
   127.0.0.1 c.localhost
   127.0.0.1 pos.localhost
   ```
4. Save and exit (Ctrl+O, Enter, Ctrl+X).

Now you can visit:
- `http://admin.localhost:3000` -> Admin Dashboard
- `http://c.localhost:3000` -> Customer Area
- `http://pos.localhost:3000` -> POS Area

---

## Production (Deployment)
When deploying to Vercel or other platforms:
1. **Wildcard Subdomains**: Ensure your domain provider and host support Wildcard Subdomains (`*.yourdomain.com`).
2. **Environment Variables**: Update `NEXT_PUBLIC_APP_URL` to your master domain (e.g., `https://goyalty.com`).
3. **Cookies**: Ensure your Supabase Auth session cookies are set on the root domain (`.yourdomain.com`) so that authentication works across all subdomains. This is usually the default in modern Supabase SSR setups.
