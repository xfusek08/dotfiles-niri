import { $ } from 'bunner/framework';

export default function create_temporary_file(pattern: string) {
    return $`mktemp -p /tmp ${pattern}`;
}
