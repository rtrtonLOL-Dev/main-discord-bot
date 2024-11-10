import { Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, type VoiceState } from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: Events.VoiceStateUpdate,
    once: false
})
export class VoiceRoomCreation extends Listener {
    private async _getCurrentJobId(memberId: string) {
        const taskList = await this.container.tasks.client.getJobs(['active' ,'delayed' ,'prioritized' ,'waiting' ,'waiting-children']);
        const task = taskList
            .filter(({ data }) => !Object.keys(data as any).includes('memberId'))
            .find(({ data }) => {
                return (data as any).memberId === memberId;
            });

        if (!task) return null;

        return task.repeatJobKey;
    }

    public override async run(previous: VoiceState, current: VoiceState) {
        if (!current.member || !current.guild) return;

        const settings = await this.container.api.getGuildSettings(current.guild.id);
        const existingId = await this._getCurrentJobId(current.member.id);

        if (!settings.voice_activity.enabled) {
            if (existingId) await this.container.tasks.client.removeJobScheduler(existingId);
            return;
        }

        // This check is here due to tracking not working if they get moved to a different voice room.
        // Also, just doesn't really make sense to track the spawn room channels anyways!
        const rooms = settings.spawn_rooms.map(({ channel_id }) => channel_id);
        if (rooms.includes(current.channelId!)) return;

        if (!current.channelId) {
            if (existingId) await this.container.tasks.client.removeJobScheduler(existingId);
        }
        else if (previous.channelId !== current.channelId) {
            if (existingId) await this.container.tasks.client.removeJobScheduler(existingId);
            
            await this.container.tasks.create(
                {
                    name: 'IncrementVoiceActivity',
                    payload: { guildId: current.guild.id, channelId: current.channelId, memberId: current.member.id },
                },
                {
                    repeated: true,
                    interval: settings.voice_activity.cooldown * 1000,
                    customJobOptions: { jobId: current.member.id }
                }
            );
        }

        return;
    }
}
