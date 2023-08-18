export function removeDuplicatesBy<T, K>(array: T[], getKey: (item: T) => K): T[] {
	const seenKeys = new Set<K>();
	const uniqueArray: T[] = [];

	for (const item of array) {
		const key = getKey(item);
		if (!seenKeys.has(key)) {
			seenKeys.add(key);
			uniqueArray.push(item);
		}
	}

	return uniqueArray;
}

const emailRegex = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

export function isEmail(str: string) {
	return emailRegex.test(str);
}
