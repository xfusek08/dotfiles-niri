import { rm, symlink } from 'node:fs/promises';

export default async function ensure_symlink({
    target,
    link_path,
}: {
    target: string;
    link_path: string;
}): Promise<void> {
    await rm(link_path, { force: true });
    await symlink(target, link_path);
}
