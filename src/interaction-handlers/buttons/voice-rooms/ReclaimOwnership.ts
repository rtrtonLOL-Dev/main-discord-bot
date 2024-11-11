import { InteractionHandler, InteractionHandlerTypes, } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { ButtonInteraction } from 'discord.js';
import { isOriginalOwner, voiceRoomInfoEmbed, voiceRoomSettingsFromOrigin } from '@/lib/util/voice-rooms';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class RenameVoiceRoom extends InteractionHandler {
    public override async parse(interaction: ButtonInteraction) {
        if (!interaction.guildId) return this.none();
        if (interaction.customId !== 'voice_room.reclaim_ownership') return this.none();

        if (!(await isOriginalOwner(interaction.guildId, interaction.channelId, interaction.user.id))) {
            await interaction.reply({
                content: 'You are not the original owner of this voice room!',
                ephemeral: true
            });

            return this.none();
        };

        return this.some();
    }

    public async run(interaction: ButtonInteraction) {
        if (!interaction.guildId || !interaction.channelId) return;

        const room = await this.container.api.getVoiceRoom(interaction.guildId, interaction.channelId);
        const channel = interaction.channel;

        if (!room || !channel) return;
        if (!channel.isVoiceBased()) return;

        if (room.current_owner_id === room.original_owner_id)
            return await interaction.reply({
                content: 'You already have control over the voice room.',
                ephemeral: true
            });

        const updatedRoom = await this.container.api.updateVoiceRoom(interaction.guildId, interaction.channelId, { transferOwner: interaction.user.id });
        if (!updatedRoom) throw new Error('Failed to update room settings.');

        const settings = await voiceRoomSettingsFromOrigin(interaction.guildId, room.origin_channel_id);
        if (!settings) throw new Error('Unable to get settings.');

        await interaction.message.edit(voiceRoomInfoEmbed(updatedRoom, settings));
        await interaction.reply({
            content: 'Successfully reclaimed voice room ownership!',
            ephemeral: true
        });
    }
}