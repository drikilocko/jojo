# Supabase setup

1. Open the project's SQL Editor and run `schema.sql`.
2. Run `seed.sql` to replace non-electronics catalog entries and load the eight electronics sample products. Back up the `products` table first if it contains custom products, since rows outside the listed electronics categories are removed.
3. Create a customer account in the app. To grant it admin access, run this query with that account's email:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'admin@example.com');
   ```

The local app configuration is in `.env.local`; `.env.example` shows the required variable names. The publishable key is intended for client use. Never put a Supabase secret/service-role key in the app.

Email/password authentication is ready. To use Google sign-in, enable the Google provider in Supabase Authentication and configure its OAuth credentials. Add `https://www.dreamyyspace.com/` to **Authentication → URL Configuration → Redirect URLs** in Supabase. Local web development uses the current `localhost` origin, which must also be allowed.

## PayDunya mobile-money checkout

The app calls the `paydunya-checkout` Edge Function instead of calling PayDunya from the browser. It creates a PayDunya invoice and starts the T-Money or Moov Togo payment through SoftPay, so the customer confirms the payment on their phone without opening the hosted checkout page. Deploy it from the project root with the Supabase CLI:

```sh
supabase functions deploy paydunya-checkout
```

In the Supabase Dashboard, open **Edge Functions → Secrets** and set `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_TOKEN`, and `PAYDUNYA_PRIVATE_KEY` using the credentials with those exact names from the same PayDunya application and mode. A PayDunya Public Key is not a substitute for the Master Key required by the Checkout Invoice API. These credentials must not use an `EXPO_PUBLIC_` prefix or be included in the app bundle. Remove any PayDunya credentials from `.env.local` after moving them to Supabase. Since the old implementation exposed payment credentials in client code, rotate those credentials before adding them as Edge Function secrets.

The order table's `payment_method` constraint must allow `tmoney` and `flooz`; this is included in `schema.sql`. For an existing database, update the constraint in the SQL Editor:

```sql
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
    check (payment_method in ('card', 'apple-pay', 'paypal', 'cod', 'tmoney', 'flooz'));
```
