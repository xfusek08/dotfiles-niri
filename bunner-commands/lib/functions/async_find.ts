export default async function async_find<T>(
    array: T[],
    predicate: (item: T) => Promise<boolean>,
): Promise<T | undefined> {
    const res: T | undefined = undefined;
    for (const item of array) {
        if (await predicate(item)) {
            return item;
        }
    }
    return res;
}
