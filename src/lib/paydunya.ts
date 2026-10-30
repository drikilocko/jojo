import { supabase } from "./supabase";

export interface PayResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function initiatePayment(
  orderId: string,
  method: "tmoney" | "flooz",
  phone: string
): Promise<PayResult> {
  try {
    const { data, error } = await supabase.functions.invoke("paydunya-checkout", {
      body: { orderId, paymentMethod: method, paymentPhone: phone },
    });
    if (error) return { success: false, error: error.message };
    return { success: true, message: data?.message };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export function isValidTogoNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("228") && digits.length === 11 ? digits.slice(3) : digits;
  return /^\d{8}$/.test(local);
}
