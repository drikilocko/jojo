insert into public.vip_access_codes (code_hash, expires_at)
values
    ('517a0aca2adff22d67fd1ee51b40230c0031fe3799ef1c395d30a3e19b50c91f', now() + interval '30 days'),
    ('4a49f09b3afeca69746d0e08535d7021adda450677234970210ac047d339d21c', now() + interval '30 days'),
    ('26485a0a540900af90c52adda34ff40e6089cacb05eed5c918a125753c645038', now() + interval '30 days')
on conflict (code_hash) do nothing;

insert into public.vip_access_codes (code_hash, expires_at, validity)
values
    ('dbb80a9d26f4bdcb41314672d511294663b6655ab1ec3befdebcf8fe88b0fcf4', null, interval '30 days'),
    ('f7cf5c33fb73d61be8c80b6e8c556044aad9e5fd50f0fd2880a6b76a9453f5d3', null, interval '30 days'),
    ('c769667425a9f3d009cdecf5e7e31b099aa6d989c8e25df2e33b491eba24c3a2', null, interval '30 days')
on conflict (code_hash) do nothing;
