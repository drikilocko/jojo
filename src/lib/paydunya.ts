// Les appels PayDunya utilisent fetch() directement pour eviter FunctionsFetchError sur le web

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export interface PayDunyaInvoiceResult {
    success: boolean;
    message?: string;
    amountXOF?: number;
    invoiceToken?: string;
    error?: string;
}

export type PayDunyaPurchaseType = 'subscription';

/**
 * Appel direct via fetch() vers la fonction Edge Supabase.
 * Evite les problemes de SDK (FunctionsFetchError) en mode web.
 */
async function callEdgeFunction(
    fnName: string,
    body: Record<string, unknown>
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
    const url = SUPABASE_URL + '/functions/v1/' + fnName;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY,
            },
            body: JSON.stringify(body),
        });

        let json: unknown;
        try {
            json = await res.json();
        } catch {
            return { data: null, error: 'Le serveur a renvoye une reponse invalide (HTTP ' + res.status + ').' };
        }

        if (!res.ok) {
            const isObj = typeof json === 'object' && json !== null && 'error' in (json as object);
            const errMsg = isObj && typeof (json as Record<string, unknown>).error === 'string'
                ? (json as Record<string, string>).error
                : 'Le service de paiement a repondu avec une erreur (HTTP ' + res.status + ').';
            return { data: null, error: errMsg };
        }

        return { data: json as Record<string, unknown>, error: null };
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return { data: null, error: 'Impossible de joindre le service de paiement. Verifiez votre connexion. (' + msg + ')' };
    }
}

export async function initiatePayDunyaPayment(
    orderId: string,
    operatorKey: string,
    paymentPhone: string,
    extra?: {
        amountXOF?: number;
        customerName?: string;
        customerEmail?: string;
        purchaseType?: PayDunyaPurchaseType;
    }
): Promise<PayDunyaInvoiceResult> {
    const body = { orderId, operatorKey, paymentPhone, ...extra };
    const { data, error } = await callEdgeFunction('paydunya-checkout', body);

    if (error) {
        return { success: false, error };
    }

    if (typeof data?.message !== 'string' || typeof data?.amountXOF !== 'number') {
        return {
            success: false,
            error: 'Le service de paiement a renvoye une reponse invalide.',
        };
    }

    return {
        success: true,
        message: data.message,
        amountXOF: data.amountXOF as number,
        invoiceToken: typeof data.invoiceToken === 'string' ? data.invoiceToken : undefined,
    };
}

export async function checkPayDunyaPaymentStatus(
    token: string,
    orderId: string,
    purchaseType: PayDunyaPurchaseType
): Promise<{ success: boolean; status?: string; error?: string }> {
    const { data, error } = await callEdgeFunction('paydunya-checkout', {
        action: 'check-status',
        token,
        orderId,
        purchaseType,
    });

    if (error) {
        return { success: false, error };
    }

    if (typeof data?.status !== 'string') {
        return { success: false, error: 'Le service de paiement a renvoyé un statut invalide.' };
    }

    return { success: true, status: data.status };
}

export function isValidTogoMobileNumber(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    const localNumber = digits.startsWith('228') && digits.length === 11
        ? digits.slice(3)
        : digits;
    return /^\d{8}$/.test(localNumber);
}

/**
 * Convertit un montant USD en XOF (FCFA)
 * 1 USD = 610 FCFA
 */
export function usdToXOF(amountUSD: number): number {
    return Math.round(amountUSD * 610);
}
