export function addTokenToURL(url: string, token?: string, api: any = null): string {
	const accessToken = token || getToken();
	if (!accessToken) return url;

	return addQueryToPath(url, { access_token: accessToken });
}

function getToken(api): string | null {
	return (api?.defaults?.headers?.common['Authorization'] as string | undefined)?.split(' ')[1] || null;
}