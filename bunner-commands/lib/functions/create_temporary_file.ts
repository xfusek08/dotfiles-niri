import { $ } from 'bunner/framework';

export default async function create_temporary_file(pattern: string) {
    const result = await $`mktemp -p /tmp ${pattern}`.text();
    return result.trim();
}
