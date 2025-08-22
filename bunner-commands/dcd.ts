import { defineCommand } from 'bunner/framework';
import { DockerComposeTool } from 'bunner/modules/docker';

export default defineCommand({
    command: 'dcd',
    description:
        'Docker Compose Down - Stops and removes all running containers for this application',
    action: async () => {
        const dc = await DockerComposeTool.create();
        await dc.downAll();
    },
});
