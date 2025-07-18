import { defineCommand, log } from 'bunner/framework';
import { DockerComposeTool } from 'bunner/modules/docker';

export default defineCommand({
    command: 'dcu',
    description:
        'Runts the docker compose up command. It cleans up any existing containers managed by local docker-compose.yml file and starts up the containers defined in the docker-compose.yml file.',
    options: [
        {
            short: 'd',
            long: 'detached',
            type: 'boolean',
            defaultValue: false,
            description: 'Run containers in the background',
        },
    ] as const,
    action: async ({ args, options }) => {
        const [profile] = args.popFirstArg();

        if (profile) {
            log.info(`Starting up docker containers with profile: ${profile}`);
        }

        const dc = await DockerComposeTool.create();
        await dc.downAll();
        await dc.up({
            profile: profile ?? undefined,
            detached: options.detached,
        });
    },
});
