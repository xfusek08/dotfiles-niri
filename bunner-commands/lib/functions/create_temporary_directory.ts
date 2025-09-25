import { $ } from 'bunner/framework';

export default function create_temporary_directory(pattern: string) {
    return $`mktemp -d /tmp/${pattern}`;
}
