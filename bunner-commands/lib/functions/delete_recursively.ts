import { $ } from 'bunner/framework';

export default function delete_recursively(path: string) {
    return $`rm -rf ${path}`;
}
