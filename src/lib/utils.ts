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
