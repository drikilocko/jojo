insert into public.vip_access_codes (code_hash, expires_at)
values
    ('517a0aca2adff22d67fd1ee51b40230c0031fe3799ef1c395d30a3e19b50c91f', now() + interval '30 days'),
    ('4a49f09b3afeca69746d0e08535d7021adda450677234970210ac047d339d21c', now() + interval '30 days'),
    ('26485a0a540900af90c52adda34ff40e6089cacb05eed5c918a125753c645038', now() + interval '30 days')
on conflict (code_hash) do nothing;
