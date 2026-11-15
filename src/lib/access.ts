import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export const ACCESS_EXPIRY_STORAGE_KEY = '@zone-de-papy/paydunya-access-expiry-v1';
export const ACCESS_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
export const ACCESS_SESSION_IDLE_MS = 10 * 60 * 1000;
const PENDING_INVOICE_TOKEN_KEY = '@zone-de-papy/pending-invoice-token-v1';
const PENDING_ORDER_ID_KEY = '@zone-de-papy/pending-order-id-v1';
const INSTALLATION_ID_KEY = '@zone-de-papy/access-code-installation-id-v1';
const SAVED_ACCESS_CODE_KEY = '@zone-de-papy/last-issued-access-code-v1';
const ACCESS_LAST_ACTIVITY_KEY = '@zone-de-papy/access-last-activity-v1';
const ACTIVITY_PERSIST_INTERVAL_MS = 30 * 1000;

let lastActivityPersistedAt = 0;

export interface SavedAccessCode {
    code: string;
    expiresAt: number;
}

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
    const storedValues = await AsyncStorage.multiGet([
        ACCESS_EXPIRY_STORAGE_KEY,
        ACCESS_LAST_ACTIVITY_KEY,
    ]);
    const storedExpiry = storedValues[0][1];
    const storedActivity = storedValues[1][1];
    if (!storedExpiry) return null;

    const expiry = Number(storedExpiry);
    const now = Date.now();
    if (!Number.isSafeInteger(expiry) || expiry <= now) {
        await AsyncStorage.multiRemove([ACCESS_EXPIRY_STORAGE_KEY, ACCESS_LAST_ACTIVITY_KEY]);
        return null;
    }

    const lastActivity = storedActivity === null ? null : Number(storedActivity);
    if (
        lastActivity !== null
        && Number.isSafeInteger(lastActivity)
        && lastActivity <= now
        && now - lastActivity >= ACCESS_SESSION_IDLE_MS
    ) {
        await AsyncStorage.multiRemove([ACCESS_EXPIRY_STORAGE_KEY, ACCESS_LAST_ACTIVITY_KEY]);
        return null;
    }

    if (lastActivity === null || !Number.isSafeInteger(lastActivity) || lastActivity > now) {
        await AsyncStorage.setItem(ACCESS_LAST_ACTIVITY_KEY, String(now));
        lastActivityPersistedAt = now;
    }

    return expiry;
}

export async function restorePaidAccess(): Promise<number | null> {
    return getPaidAccessExpiry();
}

export async function grantPaidAccess(expiry = Date.now() + ACCESS_DURATION_MS): Promise<number> {
    if (!Number.isSafeInteger(expiry) || expiry <= Date.now()) {
        throw new Error('The access code has expired or has an invalid expiry date.');
    }

    await AsyncStorage.setItem(ACCESS_EXPIRY_STORAGE_KEY, String(expiry));
    const now = Date.now();
    await AsyncStorage.setItem(ACCESS_LAST_ACTIVITY_KEY, String(now));
    lastActivityPersistedAt = now;
    return expiry;
}

export async function redeemAccessCode(code: string): Promise<number | null> {
    const installationId = await getInstallationId();
    const { data, error } = await supabase.rpc('redeem_vip_access_code', {
        p_code: code.trim(),
        p_installation_id: installationId,
    });

    if (error) throw error;
    if (typeof data !== 'string') return null;

    const expiry = Date.parse(data);
    if (!Number.isSafeInteger(expiry) || expiry <= Date.now()) return null;

    await AsyncStorage.multiSet([
        [ACCESS_EXPIRY_STORAGE_KEY, String(expiry)],
        [ACCESS_LAST_ACTIVITY_KEY, String(Date.now())],
        [
            SAVED_ACCESS_CODE_KEY,
            JSON.stringify({ code: code.trim(), expiresAt: expiry } satisfies SavedAccessCode),
        ],
    ]);
    lastActivityPersistedAt = Date.now();
    return expiry;
}

export async function recordPaidAccessActivity(): Promise<void> {
    const now = Date.now();
    if (now - lastActivityPersistedAt < ACTIVITY_PERSIST_INTERVAL_MS) return;

    lastActivityPersistedAt = now;
    try {
        await AsyncStorage.setItem(ACCESS_LAST_ACTIVITY_KEY, String(now));
    } catch (error: unknown) {
        lastActivityPersistedAt = 0;
        throw error;
    }
}

export async function clearPaidAccessSession(): Promise<void> {
    await AsyncStorage.multiRemove([ACCESS_EXPIRY_STORAGE_KEY, ACCESS_LAST_ACTIVITY_KEY]);
    lastActivityPersistedAt = 0;
}

export async function getSavedAccessCode(): Promise<SavedAccessCode | null> {
    const storedCode = await AsyncStorage.getItem(SAVED_ACCESS_CODE_KEY);
    if (!storedCode) return null;

    try {
        const savedCode = JSON.parse(storedCode) as Partial<SavedAccessCode>;
        const expiresAt = savedCode.expiresAt;
        if (
            typeof savedCode.code === 'string'
            && typeof expiresAt === 'number'
            && Number.isSafeInteger(expiresAt)
            && expiresAt > Date.now()
        ) {
            return { code: savedCode.code, expiresAt };
        }
    } catch {
        await AsyncStorage.removeItem(SAVED_ACCESS_CODE_KEY);
        return null;
    }

    await AsyncStorage.removeItem(SAVED_ACCESS_CODE_KEY);
    return null;
}

export async function getInstallationId(): Promise<string> {
    const savedId = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
    if (savedId && savedId.length >= 20 && savedId.length <= 100) return savedId;

    const installationId = [
        Date.now().toString(36),
        Math.random().toString(36).slice(2),
        Math.random().toString(36).slice(2),
    ].join('-');
    await AsyncStorage.setItem(INSTALLATION_ID_KEY, installationId);
    return installationId;
}
