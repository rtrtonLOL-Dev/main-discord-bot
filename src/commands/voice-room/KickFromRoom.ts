import { Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandType, PermissionFlagsBits, UserContextMenuCommandInteraction } from 'discord.js';

@ApplyOptions<Command.Options>({
    description: 'Kick a user from a voice room you own.'
})
export class ModerationSlowmode extends Command {
    public override async registerApplicationCommands(registry: Command.Registry) {
        registry.registerContextMenuCommand({
            type: ApplicationCommandType.User,
            name: "Kick from Voice Room"
        });
    }

    public override async contextMenuRun(interaction: UserContextMenuCommandInteraction) {
        if (!interaction.guild || !interaction.targetMember) return;

        const member = await interaction.guild.members.fetch(interaction.targetId);

        if (!member.voice.channelId) 
            return await interaction.reply({
                content: "The member you're trying to kick is not connected to a voice room.",
                ephemeral: true
            });

        const room = await this.container.api.getVoiceRoom(interaction.guild.id, member.voice.channelId);
        
        if (!room) 
            return await interaction.reply({
                content: "The member you're trying to kick is not connected to a voice room.",
                ephemeral: true
            });

        if (interaction.user.id !== room.current_owner_id)
            return await interaction.reply({
                content: "You are not the owner of this voice room.",
                ephemeral: true
            });

        if (member.permissions.has([
            PermissionFlagsBits.MuteMembers |
            PermissionFlagsBits.DeafenMembers |
            PermissionFlagsBits.MoveMembers
        ]))
            return await interaction.reply({
                content: "You cannot disconnect members that can manage voice room users.",
                ephemeral: true
            });

        await member.voice.disconnect();

        return await interaction.reply({
            content: "Successfully disconnected member from voice room.",
            ephemeral: true
        });
    }
}
