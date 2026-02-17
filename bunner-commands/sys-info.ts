import { $, defineCommand, log } from 'bunner/framework';
import Formatter from 'bunner/framework/Formatter';
import TextBuilder from 'bunner/framework/text-rendering/TextBuilder';

// Helper functions
async function getUserUid(username: string): Promise<string> {
    try {
        const result = await $`id -u ${username}`.quiet().text();
        return result.trim();
    } catch {
        return '';
    }
}

// PERMISSIONS MANAGEMENT

async function permRestricted(path: string): Promise<void> {
    log.info(`Setting restricted permissions on: ${path}`);
    try {
        // Find files with execute bit and set ug+rwx,o-r
        await $`find ${path} -type f \\( -perm /111 -exec chmod ug+rwx,o+r {} \\; \\) -o \\( ! -perm /111 -exec chmod ug+rw,o+r {} \\; \\)`;
        log.success('Restricted permissions applied');
    } catch (error) {
        log.error('Failed to set restricted permissions');
        throw error;
    }
}

async function permOpen(path: string): Promise<void> {
    log.info(`Setting open permissions on: ${path}`);
    try {
        await $`sudo find ${path} -type f \\( -perm /111 -exec chmod a+rw,u+X,g+X {} \\; \\) -o \\( ! -perm /111 -exec chmod a+rw {} \\; \\)`;
        log.success('Open permissions applied');
    } catch (error) {
        log.error('Failed to set open permissions');
        throw error;
    }
}

async function permRestrictedMe(path: string): Promise<void> {
    log.info(`Setting ownership and restricted permissions on: ${path}`);
    try {
        const user = process.env.USER || 'unknown';
        await $`sudo chown -R ${user}:${user} ${path}`;
        await $`sudo chmod -R 775 ${path}`;
        log.success('Ownership and permissions set');
    } catch (error) {
        log.error('Failed to set ownership and permissions');
        throw error;
    }
}

// GROUP INFORMATION

async function groupList(user: string = ''): Promise<void> {
    const tb = new TextBuilder();

    if (!user || user === 'all') {
        await listAllGroups(tb);
    } else {
        const actualUser = user === 'me' ? process.env.USER || '' : user;
        await listUserGroups(tb, actualUser);
    }

    console.log(tb.render());
}

async function listAllGroups(tb: TextBuilder): Promise<void> {
    try {
        const result = await $`getent group`.quiet().text();
        const groups = result.trim().split('\n');

        // Sort by GID
        const sortedGroups = groups
            .map((line: string) => {
                const [name, , gid, members] = line.split(':');
                return { name, gid: parseInt(gid), members: members || '' };
            })
            .sort((a: any, b: any) => a.gid - b.gid);

        for (const group of sortedGroups) {
            const memberList = await formatMemberList(group.members, true);
            tb.aligned([
                group.gid.toString(),
                Formatter.white(group.name),
                memberList,
            ]);
        }
    } catch (error) {
        log.error('Failed to list groups');
        throw error;
    }
}

async function listUserGroups(tb: TextBuilder, username: string): Promise<void> {
    try {
        const result = await $`groups ${username}`.quiet().text();
        const userGroups = result.trim().split(' ').slice(2); // Skip "username :"

        for (const groupName of userGroups) {
            const groupResult = await $`getent group ${groupName}`.quiet().text();
            const [name, , gid, members] = groupResult.trim().split(':');

            const memberList = await formatMemberList(members || '', true, username);
            tb.aligned([
                gid,
                Formatter.white(name),
                memberList,
            ]);
        }
    } catch (error) {
        log.error(`Failed to list groups for user: ${username}`);
        throw error;
    }
}

async function formatMemberList(
    members: string,
    showUid: boolean = false,
    highlightUser?: string,
): Promise<string> {
    if (!members) return '';

    const memberArray = members.split(',').filter((m: string) => m.trim());
    const formattedMembers = await Promise.all(
        memberArray.map(async (member: string) => {
            const uid = await getUserUid(member);
            let memberFmt = showUid && uid ? `${member}(${uid})` : member;

            if (highlightUser && member === highlightUser) {
                memberFmt = Formatter.withColorHex(memberFmt, Formatter.YELLOW);
            }

            return memberFmt;
        }),
    );

    return formattedMembers.join(',');
}

// USER INFORMATION

async function userList(): Promise<void> {
    const currentUser = process.env.USER || '';
    const tb = new TextBuilder();

    try {
        const result = await $`getent passwd`.quiet().text();
        const users = result.trim().split('\n');

        // Sort by UID
        const sortedUsers = users
            .map((line: string) => {
                const [username, , uid] = line.split(':');
                return { username, uid: parseInt(uid) };
            })
            .sort((a: any, b: any) => a.uid - b.uid);

        for (const user of sortedUsers) {
            await formatUserEntry(tb, user.username, user.uid.toString(), currentUser);
        }

        console.log(tb.render());
    } catch (error) {
        log.error('Failed to list users');
        throw error;
    }
}

async function formatUserEntry(
    tb: TextBuilder,
    username: string,
    uid: string,
    currentUser: string,
): Promise<void> {
    try {
        // Get primary group
        const primaryGroupResult = await $`id -ng ${username}`.quiet().text();
        const primaryGroup = primaryGroupResult.trim();

        const primaryGidResult = await $`id -g ${username}`.quiet().text();
        const primaryGid = primaryGidResult.trim();

        // Format username with color
        const nameColor =
            username === currentUser
                ? Formatter.withColorHex(username, Formatter.YELLOW)
                : Formatter.white(username);

        // Get groups list
        const groupsList = await formatUserGroups(username, primaryGroup, primaryGid);

        tb.aligned([uid, nameColor, groupsList]);
    } catch {
        // Skip users we can't get info for
        return;
    }
}

async function formatUserGroups(
    username: string,
    primaryGroup: string,
    primaryGid: string,
): Promise<string> {
    try {
        const groupsResult = await $`id -nG ${username}`.quiet().text();
        const allGroups = groupsResult.trim().split(' ');

        // Filter out primary group
        const supplementaryGroups = allGroups.filter((g: string) => g !== primaryGroup);

        // Format supplementary groups
        const supplementaryFormatted = await Promise.all(
            supplementaryGroups.map(async (group: string) => {
                const gidResult = await $`getent group ${group}`.quiet().text();
                const gid = gidResult.trim().split(':')[2];
                return gid ? `${group}(${gid})` : group;
            }),
        );

        const primaryFormatted = Formatter.withColorHex(`${primaryGroup}(${primaryGid})`, Formatter.GREEN);
        const suppFormatted = supplementaryFormatted.join(', ');

        return suppFormatted ? `${primaryFormatted}, ${suppFormatted}` : primaryFormatted;
    } catch {
        return '';
    }
}

// SERVICE MANAGEMENT

async function serviceIsRunning(serviceName: string): Promise<void> {
    if (!serviceName) {
        log.error('Usage: sys-info service-is-running <service>');
        process.exit(1);
    }

    try {
        const result = await $`systemctl is-active ${serviceName}`.quiet().text();
        if (result.trim() === 'active') {
            console.log(`${serviceName} is running`);
        } else {
            console.log(`${serviceName} is not running`);
        }
    } catch {
        console.log(`${serviceName} is not running`);
    }
}

async function serviceListOnStartup(): Promise<void> {
    const tb = new TextBuilder();

    try {
        const result =
            await $`systemctl list-unit-files --type=service --state=enabled`.quiet().text();
        const lines = result
            .trim()
            .split('\n')
            .filter((line: string) => line.includes('.service'));

        const services = lines
            .map((line: string) => {
                const parts = line.trim().split(/\s+/);
                const service = parts[0].replace('.service', '');
                const status = parts[1];
                return { service, status };
            })
            .sort((a: any, b: any) => a.service.localeCompare(b.service));

        for (const { service, status } of services) {
            tb.aligned([service, status]);
        }

        console.log(tb.render());
    } catch (error) {
        log.error('Failed to list services');
        throw error;
    }
}

// Main command definition
export default defineCommand({
    command: 'sys-info',
    description: 'System information and management utilities for permissions, groups, users, and services',
    action: async ({ args }) => {
        const subcommand = args.args[0];
        const arg1 = args.args[1];
        const arg2 = args.args[2];

        if (!subcommand) {
            const tb = new TextBuilder();
            tb.line();
            tb.line(Formatter.formatTitle('System Information and Management'));
            tb.line();
            tb.line('Usage: sys-info <subcommand> [args...]');
            tb.line();
            tb.line(Formatter.formatTitle('Available subcommands'));
            tb.line();
            tb.indent();
            tb.aligned([Formatter.formatCommandName('perm-restricted'), '<path>', 'Set restricted permissions (ug+rw,o+r)']);
            tb.aligned([Formatter.formatCommandName('perm-open'), '<path>', 'Set open permissions (a+rw)']);
            tb.aligned([Formatter.formatCommandName('perm-restricted-me'), '<path>', 'Set ownership to current user and 775']);
            tb.aligned([Formatter.formatCommandName('group-list'), '[user|me|all]', 'List groups (all/specific user/current user)']);
            tb.aligned([Formatter.formatCommandName('user-list'), '', 'List all users with their groups']);
            tb.aligned([Formatter.formatCommandName('service-is-running'), '<service>', 'Check if a service is running']);
            tb.aligned([Formatter.formatCommandName('service-list-on-startup'), '', 'List services enabled on startup']);
            tb.unindent();
            tb.line();
            console.log(tb.render());
            process.exit(0);
        }

        switch (subcommand) {
            case 'perm-restricted':
                if (!arg1) {
                    log.error('Usage: sys-info perm-restricted <path>');
                    process.exit(1);
                }
                await permRestricted(arg1);
                break;

            case 'perm-open':
                if (!arg1) {
                    log.error('Usage: sys-info perm-open <path>');
                    process.exit(1);
                }
                await permOpen(arg1);
                break;

            case 'perm-restricted-me':
                if (!arg1) {
                    log.error('Usage: sys-info perm-restricted-me <path>');
                    process.exit(1);
                }
                await permRestrictedMe(arg1);
                break;

            case 'group-list':
                await groupList(arg1);
                break;

            case 'user-list':
                await userList();
                break;

            case 'service-is-running':
                await serviceIsRunning(arg1);
                break;

            case 'service-list-on-startup':
                await serviceListOnStartup();
                break;

            default:
                log.error(`Unknown subcommand: ${subcommand}`);
                console.log('Run "sys-info" without arguments to see available subcommands');
                process.exit(1);
        }
    },
});
