// ─── Operateurs PayDunya par pays ──────────────────────────────────────────
const OPERATOR_CONFIG = {
    'tmoney-tg':   { endpoint: 't-money-togo',              buildBody: ({ token, name, email, phone, address }) => ({ name_t_money: name, email_t_money: email, phone_t_money: phone, payment_token: token }) },
    'flooz-tg':    { endpoint: 'moov-togo',                 buildBody: ({ token, name, email, phone, address }) => ({ moov_togo_customer_fullname: name, moov_togo_email: email, moov_togo_customer_address: address, moov_togo_phone_number: phone, payment_token: token }) },
    'orange-sn':   { endpoint: 'orange-money-senegal',      buildBody: ({ token, name, email, phone, address }) => ({ senegal_customer_fullname: name, senegal_customer_email: email, senegal_customer_phone_number: phone, payment_token: token }) },
    'wave-sn':     { endpoint: 'wave-senegal',              buildBody: ({ token, name, email, phone, address }) => ({ senegal_customer_fullname: name, senegal_customer_email: email, senegal_customer_phone_number: phone, payment_token: token }) },
    'free-sn':     { endpoint: 'free-money-senegal',        buildBody: ({ token, name, email, phone, address }) => ({ senegal_customer_fullname: name, senegal_customer_email: email, senegal_customer_phone_number: phone, payment_token: token }) },
    'orange-ci':   { endpoint: 'orange-money-cote-divoire', buildBody: ({ token, name, email, phone, address }) => ({ ci_customer_fullname: name, ci_customer_email: email, ci_customer_phone_number: phone, payment_token: token }) },
    'mtn-ci':      { endpoint: 'mtn-ci',                    buildBody: ({ token, name, email, phone, address }) => ({ ci_customer_fullname: name, ci_customer_email: email, ci_customer_phone_number: phone, payment_token: token }) },
    'moov-ci':     { endpoint: 'moov-cote-divoire',         buildBody: ({ token, name, email, phone, address }) => ({ ci_customer_fullname: name, ci_customer_email: email, ci_customer_phone_number: phone, payment_token: token }) },
    'orange-bf':   { endpoint: 'orange-money-burkina',      buildBody: ({ token, name, email, phone, address }) => ({ bf_customer_fullname: name, bf_customer_email: email, bf_customer_phone_number: phone, payment_token: token }) },
    'moov-bf':     { endpoint: 'moov-burkina',              buildBody: ({ token, name, email, phone, address }) => ({ bf_customer_fullname: name, bf_customer_email: email, bf_customer_phone_number: phone, payment_token: token }) },
    'orange-ml':   { endpoint: 'orange-money-mali',         buildBody: ({ token, name, email, phone, address }) => ({ ml_customer_fullname: name, ml_customer_email: email, ml_customer_phone_number: phone, payment_token: token }) },
    'moov-ml':     { endpoint: 'moov-mali',                 buildBody: ({ token, name, email, phone, address }) => ({ ml_customer_fullname: name, ml_customer_email: email, ml_customer_phone_number: phone, payment_token: token }) },
    'mtn-bj':      { endpoint: 'mtn-benin',                 buildBody: ({ token, name, email, phone, address }) => ({ bj_customer_fullname: name, bj_customer_email: email, bj_customer_phone_number: phone, payment_token: token }) },
    'moov-bj':     { endpoint: 'moov-benin',                buildBody: ({ token, name, email, phone, address }) => ({ bj_customer_fullname: name, bj_customer_email: email, bj_customer_phone_number: phone, payment_token: token }) },
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const jsonResp = (body, status) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const isRec = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const customDataValue = (customData, key) => {
    if (isRec(customData)) return customData[key];
    if (Array.isArray(customData)) {
        const entry = customData.find((item) => isRec(item) && item.name === key);
        return isRec(entry) ? entry.value : undefined;
    }
    return undefined;
};
const SUBSCRIPTION_AMOUNT_XOF = 30500;

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return jsonResp({ error: 'Methode non autorisee.' }, 405);

    let payload;
    try { payload = await req.json(); } catch { return jsonResp({ error: 'JSON invalide.' }, 400); }
    if (!isRec(payload)) return jsonResp({ error: 'JSON invalide.' }, 400);

    const masterKey = Deno.env.get('PAYDUNYA_MASTER_KEY');
    const pdToken   = Deno.env.get('PAYDUNYA_TOKEN');
    const privKey   = Deno.env.get('PAYDUNYA_PRIVATE_KEY');
    if (!masterKey || !pdToken || !privKey) return jsonResp({ error: 'Service de paiement non configure.' }, 500);

    const pdHeaders = { 'Content-Type': 'application/json', 'PAYDUNYA-MASTER-KEY': masterKey, 'PAYDUNYA-PRIVATE-KEY': privKey, 'PAYDUNYA-TOKEN': pdToken };

    // ── check-status ──────────────────────────────────────────────────────
    if (payload.action === 'check-status') {
        const tok = payload.token;
        const orderId = payload.orderId;
        if (typeof tok !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(tok.trim()))
            return jsonResp({ error: 'Token invalide.' }, 400);
        if (payload.purchaseType === 'subscription' && (typeof orderId !== 'string' || !orderId.trim()))
            return jsonResp({ error: 'Référence de paiement manquante.' }, 400);

        try {
            const r = await fetch(`https://app.paydunya.com/api/v1/checkout-invoice/confirm/${encodeURIComponent(tok.trim())}`, { method: 'GET', headers: pdHeaders });
            const d = await r.json();
            if (!r.ok || !isRec(d)) return jsonResp({ error: 'Réponse de vérification PayDunya invalide.' }, 502);

            if (payload.purchaseType === 'subscription') {
                const invoice = isRec(d.invoice) ? d.invoice : null;
                const customData = d.custom_data ?? invoice?.custom_data;
                const invoiceAmount = invoice?.total_amount ?? d.total_amount;
                if (
                    customDataValue(customData, 'order_id') !== orderId
                    || customDataValue(customData, 'purchase_type') !== 'subscription'
                    || Number(invoiceAmount) !== SUBSCRIPTION_AMOUNT_XOF
                ) {
                    return jsonResp({ error: 'Ce paiement ne correspond pas à cet abonnement.' }, 403);
                }
            }

            const rawStatus = typeof d.status === 'string' ? d.status.toLowerCase() : 'pending';
            const status = ['completed', 'pending', 'cancelled', 'failed'].includes(rawStatus) ? rawStatus : 'pending';
            return jsonResp({ status }, 200);
        } catch {
            return jsonResp({ error: 'Impossible de verifier le statut.' }, 502);
        }
    }

    // ── Initier un paiement ───────────────────────────────────────────────
    const { orderId, operatorKey, paymentPhone, customerName, customerEmail, amountXOF } = payload;
    const purchaseType = payload.purchaseType === 'subscription' ? 'subscription' : 'order';
    if (typeof orderId !== 'string' || !orderId.trim()) return jsonResp({ error: 'orderId invalide.' }, 400);
    if (typeof operatorKey !== 'string' || !OPERATOR_CONFIG[operatorKey]) return jsonResp({ error: 'Operateur non supporte: ' + operatorKey }, 400);
    if (typeof paymentPhone !== 'string' || !/^\d{6,15}$/.test(paymentPhone.replace(/\D/g, ''))) return jsonResp({ error: 'Numero de telephone invalide.' }, 400);

    const phone = paymentPhone.replace(/\D/g, '');
    const name  = (typeof customerName === 'string' && customerName.trim()) ? customerName.trim() : 'Client VIP';
    const email = (typeof customerEmail === 'string' && customerEmail.trim()) ? customerEmail.trim() : 'vip@zonedepapy.com';
    const amount = purchaseType === 'subscription'
        ? SUBSCRIPTION_AMOUNT_XOF
        : (typeof amountXOF === 'number' && amountXOF > 0) ? amountXOF : SUBSCRIPTION_AMOUNT_XOF;
    const description = purchaseType === 'subscription'
        ? 'Pass Videos VIP 30 Jours - Zone de Papy'
        : 'Commande Zone de Papy';

    // Creer la facture
    let invRes;
    try {
        invRes = await fetch('https://app.paydunya.com/api/v1/checkout-invoice/create', {
            method: 'POST', headers: pdHeaders,
            body: JSON.stringify({
                invoice: { total_amount: amount, description },
                store: { name: 'Zone de Papy', tagline: 'Acces VIP Exclusif', phone_number: '+22890000000', postal_address: 'Afrique de Ouest' },
                actions: { cancel_url: 'https://zonedepapy.com/cancel', return_url: 'https://zonedepapy.com/success', callback_url: 'https://zonedepapy.com/api/ipn' },
                custom_data: {
                    order_id: orderId,
                    purchase_type: purchaseType,
                    customer_name: name,
                    customer_phone: phone,
                    operator: operatorKey,
                },
            }),
        });
    } catch { return jsonResp({ error: 'Impossible de joindre PayDunya.' }, 502); }

    let invData;
    try { invData = await invRes.json(); } catch { return jsonResp({ error: 'Reponse invalide de PayDunya.' }, 502); }
    if (!invRes.ok || invData.response_code !== '00' || !invData.token)
        return jsonResp({ error: invData.description || invData.response_text || ('PayDunya erreur HTTP ' + invRes.status) }, 502);

    // Declencher SoftPay (push USSD)
    const opConf = OPERATOR_CONFIG[operatorKey];
    const spBody = opConf.buildBody({ token: invData.token, name, email, phone, address: 'Afrique de Ouest' });
    let spRes;
    try {
        spRes = await fetch('https://app.paydunya.com/api/v1/softpay/' + opConf.endpoint, { method: 'POST', headers: pdHeaders, body: JSON.stringify(spBody) });
    } catch { return jsonResp({ error: 'Facture creee mais paiement mobile injoignable.' }, 502); }

    let spData;
    try { spData = await spRes.json(); } catch { return jsonResp({ error: 'Reponse SoftPay invalide (HTTP ' + spRes.status + ').' }, 502); }

    if (!spRes.ok || !isRec(spData) || spData.success !== true) {
        const msg = isRec(spData) ? ([spData.message, spData.error].find(v => typeof v === 'string')) : undefined;
        return jsonResp({ error: msg || ('SoftPay echec HTTP ' + spRes.status) }, 502);
    }

    return jsonResp({
        message: typeof spData.message === 'string' ? spData.message : 'Demande envoyee. Valide sur ton telephone.',
        amountXOF: amount,
        invoiceToken: invData.token,
    }, 200);
});
