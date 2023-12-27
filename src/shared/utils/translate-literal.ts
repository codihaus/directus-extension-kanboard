export function translate(literal: any, t: Function): string {
	let translated = literal;

	if (typeof literal === 'string' && literal.startsWith('$t:')) translated = t(literal.replace('$t:', ''));

	return translated;
}
