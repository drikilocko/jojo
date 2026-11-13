import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACCESS_EXPIRY_STORAGE_KEY = '@zone-de-papy/paydunya-access-expiry-v1';
export const ACCESS_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const PENDING_INVOICE_TOKEN_KEY = '@zone-de-papy/pending-invoice-token-v1';
const PENDING_ORDER_ID_KEY = '@zone-de-papy/pending-order-id-v1';

export interface PendingPayDunyaPayment {
    token: string;
    orderId: string;
}

export async function getPendingPayDunyaPayment(): Promise<PendingPayDunyaPayment | null> {
    const values = await AsyncStorage.multiGet([PENDING_INVOICE_TOKEN_KEY, PENDING_ORDER_ID_KEY]);
    const token = values[0][1];
    const orderId = values[1][1];
    return token && orderId ? { token, orderId } : null;
}

export async function savePendingPayDunyaPayment(token: string, orderId: string): Promise<void> {
    await AsyncStorage.multiSet([
        [PENDING_INVOICE_TOKEN_KEY, token],
        [PENDING_ORDER_ID_KEY, orderId],
    ]);
}

export async function clearPendingPayDunyaPayment(): Promise<void> {
    await AsyncStorage.multiRemove([PENDING_INVOICE_TOKEN_KEY, PENDING_ORDER_ID_KEY]);
}

export async function getPaidAccessExpiry(): Promise<number | null> {
    const storedExpiry = await AsyncStorage.getItem(ACCESS_EXPIRY_STORAGE_KEY);
    if (!storedExpiry) return null;

    const expiry = Number(storedExpiry);
    if (!Number.isSafeInteger(expiry)) {
        await AsyncStorage.removeItem(ACCESS_EXPIRY_STORAGE_KEY);
        return null;
    }

    return expiry > Date.now() ? expiry : null;
}

export async function grantPaidAccess(): Promise<number> {
    const expiry = Date.now() + ACCESS_DURATION_MS;
    await AsyncStorage.setItem(ACCESS_EXPIRY_STORAGE_KEY, String(expiry));
    return expiry;
}
