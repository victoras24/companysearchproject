import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

interface ToastMessages<T> {
	loading: string;
	success: string | ((data: T) => string);
	error: string | ((error: unknown) => string);
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const executeWithToast = async <T>(
	asyncFunction: () => Promise<T>,
	messages: ToastMessages<T>
): Promise<T> => {
	const promise = asyncFunction();

	toast.promise(promise, {
		loading: messages.loading,
		success: messages.success,
		error: messages.error,
	});

	return await promise;
};
