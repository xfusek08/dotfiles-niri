// File: update-images.ts
import { $, log } from 'bunner/framework';
import { defineCommand } from 'bunner/framework';
import BunnerError from 'bunner/framework/types/BunnerError';
import TextBuilder from 'bunner/framework/text-rendering/TextBuilder';

type ImageInfo = { name: string };

export default defineCommand({
    command: 'dui',
    description:
        'Docker Update Images - Pulls the latest versions of all Docker images present on the system.',
    options: [] as const,
    action: async () => {
        try {
            const images = await getImageList();
            const total = images.length;

            if (total === 0) {
                log.info('No Docker images found');
                return;
            }

            let updated = 0;
            let upToDate = 0;
            let failed = 0;
            let skipped = 0;

            log.info(`Pulling ${total} Docker images...`);

            for (const { name: imageName } of images) {
                const before = await getImageDigest(imageName);
                log.info(`Pulling ${imageName}...`);

                try {
                    await $`docker pull ${imageName}`;
                    const after = await getImageDigest(imageName);
                    if (after == null) {
                        failed++;
                        log.error(`✗ Failed ${imageName}`);
                        continue;
                    }
                    if (before == null || before !== after) {
                        updated++;
                        log.success(`✓ Updated ${imageName}`);
                    } else {
                        upToDate++;
                        log.success(`✓ Already latest ${imageName}`);
                    }
                } catch {
                    skipped++;
                    log.warn(`↷ Skipped ${imageName} (pull not available)`);
                    continue;
                }
            }

            console.log();
            const tb = new TextBuilder();
            tb.line('Docker images update report:');
            tb.line(`  Updated:        ${updated}`);
            tb.line(`  Up-to-date:     ${upToDate}`);
            tb.line(`  Skipped:        ${skipped}`);
            tb.line(`  Failed:         ${failed}`);
            tb.line(`  Total images:   ${total}`);
            console.log(tb.render());
        } catch (error) {
            throw new BunnerError(`Image update failed: ${error}`, 1);
        }
    },
});

async function getImageList(): Promise<ImageInfo[]> {
    const result: string =
        await $`docker image ls --format "{{.Repository}}:{{.Tag}}"`.text();
    const names: string[] = result
        .split('\n')
        .filter((line: string) => line.length > 0 && !line.includes('<none>'));
    const uniqueSorted: string[] = Array.from(new Set<string>(names)).sort();
    return uniqueSorted.map((name: string): ImageInfo => ({ name }));
}

async function getImageDigest(imageName: string): Promise<string | null> {
    try {
        const out =
            await $`docker image inspect --format "{{index .RepoDigests 0}}" ${imageName}`.text();
        return out.trim();
    } catch {
        return null;
    }
}
