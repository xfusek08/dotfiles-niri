import { writeFile } from 'node:fs/promises';

export type DesktopEntryOptions = {
    version?: string;
    name: string;
    comment?: string;
    genericName?: string;
    keywords?: string[];
    exec: string;
    icon?: string;
    terminal?: boolean;
    type?: string;
    categories?: string[];
    mimeType?: string[];
    startupNotify?: boolean;
    additionalFields?: Record<string, string>;
};

function formatList(values?: string[]): string | undefined {
    if (!values || values.length === 0) {
        return undefined;
    }
    return values.join(';') + ';';
}

export default async function create_desktop_entry({
    desktopFile,
    options,
}: {
    desktopFile: string;
    options: DesktopEntryOptions;
}): Promise<void> {
    const lines = [
        '[Desktop Entry]',
        `Version=${options.version ?? '1.0'}`,
        `Name=${options.name}`,
    ];

    if (options.comment) {
        lines.push(`Comment=${options.comment}`);
    }

    if (options.genericName) {
        lines.push(`GenericName=${options.genericName}`);
    }

    const keywords = formatList(options.keywords);
    if (keywords) {
        lines.push(`Keywords=${keywords}`);
    }

    lines.push(`Exec=${options.exec}`);
    lines.push(`Terminal=${options.terminal ? 'true' : 'false'}`);
    lines.push(`Type=${options.type ?? 'Application'}`);

    if (options.icon) {
        lines.push(`Icon=${options.icon}`);
    }

    const categories = formatList(options.categories);
    if (categories) {
        lines.push(`Categories=${categories}`);
    }

    const mimeType = formatList(options.mimeType);
    if (mimeType) {
        lines.push(`MimeType=${mimeType}`);
    }

    if (options.startupNotify !== undefined) {
        lines.push(`StartupNotify=${options.startupNotify ? 'true' : 'false'}`);
    }

    if (options.additionalFields) {
        for (const [key, value] of Object.entries(options.additionalFields)) {
            lines.push(`${key}=${value}`);
        }
    }

    lines.push('');

    await writeFile(desktopFile, lines.join('\n'), { mode: 0o644 });
}
