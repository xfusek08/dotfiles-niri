import { rm, symlink } from 'node:fs/promises';

export default async function ensure_symlink(
    target: string,
    linkPath: string,
): Promise<void> {
    await rm(linkPath, { force: true });
    await symlink(target, linkPath);
}
