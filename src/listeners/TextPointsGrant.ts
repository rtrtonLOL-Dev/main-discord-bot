import { Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { AttachmentBuilder, Events, Message, inlineCode } from 'discord.js';

/**
 * @TODO Implement easteregg:
 * Chance for "activity" to become "activiy", suggested by @arlocomotive
 */

@ApplyOptions<Listener.Options>({
    event: Events.MessageCreate,
    once: false
})
export class PointsGrant extends Listener {
    public override async run(message: Message) {
        if (message.author.bot || message.system) return;
        if (!message.guildId) return;

        const guildId = message.guildId;
        const memberId = message.author.id;

        const { chat_activity: { enabled, cooldown } } = await this.container.api.getGuildSettings(guildId);
        if (!enabled) return;

        const time = Math.floor(new Date().getTime() / 1000);
        const currentProfile = await this.container.api.getMemberProfile(guildId, memberId);
        if (time < (new Date(currentProfile.chat_activity.last_grant).getTime() / 1000) + cooldown) return;

        const updatedProfile = await this.container.api.incrementMemberPoints(guildId, memberId, 'chat');
        const memberRoles = message.member?.roles.cache.map((r) => r.id) || [];
        const missingRoles = updatedProfile.chat_activity.current_roles
            .map((r) => r.role_id)
            .filter((r) => !memberRoles.includes(r));

        if (missingRoles.length) {
            const added = await message.member?.roles.add(missingRoles).catch(() => false).then(() => true);
            if (!added) return;
        }

        if (missingRoles.length === 1) {
            const role = message.guild?.roles.cache.get(missingRoles[0]);
            const activityRole = updatedProfile.chat_activity.current_roles.find(({ role_id }) => role_id === missingRoles[0]);
            if (!role || !activityRole) return;

            const notice = new AttachmentBuilder(
                await this.container.imageGenerators.generateRankUpNotice({
                    message: `@${message.author.displayName} congrats, you've reached ${activityRole.required_points} points and unlocked a new role!`,
                    role: { name: role.name, color: role.hexColor },
                }),
                { name: `${message.author.id}-rankup.png` },
            );

            try {
                await message.reply({ files: [notice] });
            }
            catch {
                await message.reply({
                    content: `@${message.author.displayName} congrats, you've reached ${inlineCode(activityRole.required_points.toString())} points and unlocked the ${inlineCode(role.name)} activity role!`,
                });
            }
        }
    }
}
