import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { type AutocompleteInteraction, type GuildBasedChannel } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Autocomplete
})
export class ExistingSpawnRoomChannelId extends InteractionHandler {
    public override async parse(interaction: AutocompleteInteraction) {
        if (interaction.options.getSubcommand() === 'create') {
            return this.none();
        }

        if (interaction.options.getFocused(true).name !== 'channel-id') {
            return this.none();
        }

        return this.some();
    }

    public async run(interaction: AutocompleteInteraction) {
        if (!interaction.guild) {
            return await interaction.respond([{
                name: 'No channels found!',
                value: ""
            }]);
        }

        const settings = await this.container.api.getGuildSettings(interaction.guildId!);
        const spawnRooms = await Promise.all(settings.spawn_rooms
            .map(async (c) => {
                const channel = await interaction.guild!.channels.fetch(c.channel_id).catch(() => null);

                if (!channel) {
                    await this.container.api.deleteVoiceSpawnRoom(interaction.guild!.id, c.channel_id);
                }

                return channel;
            })
            .filter((c) => c !== null)) as GuildBasedChannel[];

        if (!spawnRooms.length) {
            return await interaction.respond([{
                name: 'No channels found!',
                value: ""
            }]);
        }

        return await interaction.respond(spawnRooms.map((c) => ({
            name: `🔊 ${c.name} (${c.id})`,
            value: c.id
        })));
    }
}