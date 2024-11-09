import { UserError } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ApplyOptions } from '@sapphire/decorators';
import {
    ApplicationCommandOptionType,
    PermissionFlagsBits,
    type ApplicationCommandSubCommandData,
    type ApplicationCommandSubGroupData
} from 'discord.js';

@ApplyOptions<Subcommand.Options>({
    description: 'Manage settings for the current guild.',
    subcommands: [
        {
            name: 'spawn-rooms',
            type: 'group',
            entries: [
                { name: 'create', chatInputRun: 'createSpawnRoom' },
                { name: 'modify', chatInputRun: 'modifySpawnRoom' },
                { name: 'remove', chatInputRun: 'removeSpawnRoom' },
            ]
        }
    ]
})
export class Settings extends Subcommand {
    private readonly _options: (ApplicationCommandSubCommandData | ApplicationCommandSubGroupData)[] = [
        {
            type: ApplicationCommandOptionType.SubcommandGroup,
            name: 'spawn-rooms',
            description: "Manage the voice spawn rooms for the guild.",
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'create',
                    description: 'Create a new spawn room.',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'channel_id',
                            description: "Whether or not the room spawned can be locked.",
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.Number,
                            name: 'user_limit',
                            description: "Whether or not the room spawned can be locked.",
                            min_value: 1,
                            max_value: 99
                        },
                        {
                            type: ApplicationCommandOptionType.Boolean,
                            name: 'can_rename',
                            description: "Whether or not the room spawned can be locked.",
                        },
                        {
                            type: ApplicationCommandOptionType.Boolean,
                            name: 'can_lock',
                            description: "Whether or not the room spawned can be locked.",
                        },
                        {
                            type: ApplicationCommandOptionType.Boolean,
                            name: 'can_adjust_limit',
                            description: "Whether or not the room spawned can be locked.",
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'modify',
                    description: 'Create a new spawn room.',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'channel_id',
                            description: "Whether or not the room spawned can be locked.",
                            required: true
                        },
                        {
                            type: ApplicationCommandOptionType.Number,
                            name: 'user_limit',
                            description: "Whether or not the room spawned can be locked.",
                            min_value: 1,
                            max_value: 99
                        },
                        {
                            type: ApplicationCommandOptionType.Boolean,
                            name: 'can_rename',
                            description: "Whether or not the room spawned can be locked.",
                        },
                        {
                            type: ApplicationCommandOptionType.Boolean,
                            name: 'can_lock',
                            description: "Whether or not the room spawned can be locked.",
                        },
                        {
                            type: ApplicationCommandOptionType.Boolean,
                            name: 'can_adjust_limit',
                            description: "Whether or not the room spawned can be locked.",
                        }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'remove',
                    description: 'Remove an existing spawn room.',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'channel_id',
                            description: "Whether or not the room spawned can be locked.",
                            required: true
                            // autocomplete: true
                        }
                    ]
                }
            ]
        },
    ];

    public override async registerApplicationCommands(registry: Subcommand.Registry) {
        registry
            .registerChatInputCommand({
                name: this.name,
                description: this.description,
                options: this._options,
                defaultMemberPermissions: [PermissionFlagsBits.Administrator],
                dmPermission: false
            });
    }

    private _removeNullOptions<T extends Object>(options: T) {
        const settings = Object.entries(options)
            .reduce((acc, [k, v]) => {
                // Only add properties that are not null
                if (v !== null) {
                    acc[k as keyof T] = v;
                }

                return acc;
            }, {} as Partial<{ [K in keyof T]?: Exclude<T[K], null> | Exclude<T[K], null> }>);
    
        return settings;
    }

    public async createSpawnRoom(interaction: Subcommand.ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const channelId = interaction.options.getString('channel_id', true);
        const options = this._removeNullOptions({
            user_limit: interaction.options.getNumber('user_limit'),
            can_rename: interaction.options.getBoolean('can_rename'),
            can_lock: interaction.options.getBoolean('can_lock'),
            can_adjust_limit: interaction.options.getBoolean('can_adjust_limit'),
        });

        await interaction.deferReply({ fetchReply: true, ephemeral: true });

        const created = await this.container.api.createVoiceSpawnRoom(interaction.guild.id, channelId, options);

        return await interaction.editReply({
            content: `Successfully created a spawn room: <#${created.channel_id}>!`
        });
    }

    public async modifySpawnRoom(interaction: Subcommand.ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const channelId = interaction.options.getString('channel_id', true);
        const options = this._removeNullOptions({
            user_limit: interaction.options.getNumber('user_limit'),
            can_rename: interaction.options.getBoolean('can_rename'),
            can_lock: interaction.options.getBoolean('can_lock'),
            can_adjust_limit: interaction.options.getBoolean('can_adjust_limit'),
        });

        if (!Object.keys(options).length) {
            throw new UserError({
                identifier: 'NO_SETTINGS',
                message: 'Please provide some settings to update.'
            });
        }

        await interaction.deferReply({ fetchReply: true, ephemeral: true });
        
        const updated = await this.container.api.modifyVoiceSpawnRoom(interaction.guild.id, channelId, options);

        return await interaction.editReply({
            content: `Successfully updated the spawn room: <#${updated.channel_id}>!`
        });
    }

    public async removeSpawnRoom(interaction: Subcommand.ChatInputCommandInteraction) {
        if (!interaction.guild) return;

        const channelId = interaction.options.getString('channel_id', true);

        await interaction.deferReply({ fetchReply: true, ephemeral: true });

        const deleted = await this.container.api.deleteVoiceSpawnRoom(interaction.guild.id, channelId);

        if (deleted) {
            return await interaction.editReply({
                content: `Successfully removed the spawn room <#${channelId}>!`
            });
        }

        return await interaction.editReply({
            content: `Failed to remove the spawn room <#${channelId}>!`
        });
    }
}