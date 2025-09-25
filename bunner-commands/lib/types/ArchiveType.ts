export const ArchiveTypes = ['tar.gz', 'tar.xz', 'zip'] as const;
export type ArchiveType = (typeof ArchiveTypes)[number];
