import { $ } from 'bunner/framework';

export default async function create_temporary_directory(pattern: string) {
    const result = await $`mktemp -d /tmp/${pattern}`.text();
    return result.trim();
}
