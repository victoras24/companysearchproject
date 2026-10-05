import axios from "axios";

type TokenSource = () => Promise<string | null>;

let tokenSource: TokenSource = async () => null;

/** Set once by the auth module, which knows whose session it is. */
export const setAccessTokenSource = (source: TokenSource) => {
	tokenSource = source;
};

/**
 * The backend routes that act for the signed-in user. Every request carries the current access
 * token; no caller handles tokens itself.
 */
export const userApi = axios.create({ baseURL: `${import.meta.env.VITE_API_URL}/api` });

userApi.interceptors.request.use(async (config) => {
	const token = await tokenSource();
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});
