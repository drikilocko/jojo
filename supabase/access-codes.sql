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

insert into public.vip_access_codes (code_hash, expires_at, validity)
values
    ('68e12dadc74cdd02fd43c15883e99e9885803b28f16f6bf91f237214ccda9cc2', null, interval '30 days'),
    ('7d8fdcbf5274db78fcf8b3c476e3c0977e021ef798f90800c3625bf2f4fca448', null, interval '30 days'),
    ('57b104d11a2950136282ca1a135765080d5b8ee01294d8747c6ee32387aced55', null, interval '30 days'),
    ('2e88d6a7a5b02acaaf32e7e743260a0088100359e0328f1bf1eb44b836ae65a4', null, interval '30 days'),
    ('a69c2b91408a8f0f288950b0b29186a5515066ea8f4ed5578ab8d2cb3e3a1914', null, interval '30 days')
on conflict (code_hash) do nothing;
