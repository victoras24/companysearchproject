import { isAxiosError } from "axios";
import { userApi } from "@/api/userApi";

/**
 * What an alert's unsubscribe link does: turns alert emails off for the user its token belongs
 * to, signed in or not. "invalid" when the link carries no token or one the backend does not know.
 */
export async function turnAlertEmailsOff(token: string | null): Promise<"off" | "invalid"> {
	if (!token?.trim()) return "invalid";
	try {
		await userApi.post("/alerts/unsubscribe", { token: token.trim() });
		return "off";
	} catch (error) {
		if (isAxiosError(error) && error.response?.status === 404) return "invalid";
		throw error;
	}
}
