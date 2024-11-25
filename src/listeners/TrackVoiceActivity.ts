import { Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, type VoiceState } from 'discord.js';

@ApplyOptions<Listener.Options>({
    event: Events.VoiceStateUpdate,
    once: false
})
export class VoiceRoomCreation extends Listener {
    private async _getCurrentTask(memberId: string) {
        const taskList = await this.container.tasks.client.getJobs(['active' ,'delayed' ,'prioritized' ,'waiting' ,'waiting-children']);
        const task = taskList
            .filter(({ data }) => Object.keys(data as any).includes('memberId'))
            .find(({ data }) => {
                return (data as any).memberId === memberId;
            });

        if (!task) return null;

        return task;
    }

    private async _createNewTask(payload: { guildId: string; channelId: string; memberId: string }) {
        const settings = await this.container.api.getGuildSettings(payload.guildId);

        return await this.container.tasks.create(
            {
                name: 'IncrementVoiceActivity',
                payload: payload,
            },
            {
                repeated: true,
                interval: settings.voice_activity.cooldown * 1000,
                customJobOptions: { jobId: payload.memberId }
            }
        );
    }

    public override async run(previous: VoiceState, current: VoiceState) {
        if (!current.member || !current.guild) return;

        const settings = await this.container.api.getGuildSettings(current.guild.id);
        const existingTask = await this._getCurrentTask(current.member.id);

        if (!settings.voice_activity.enabled) {
            if (existingTask) await this.container.tasks.client.removeJobScheduler(existingTask.repeatJobKey!);
            return;
        }

        if (!current.channelId) {
            if (existingTask) await this.container.tasks.client.removeJobScheduler(existingTask.repeatJobKey!);
        }
        else if (previous.channelId === null && current.channelId !== null) {
            await this._createNewTask({ guildId: current.guild.id, channelId: current.channelId, memberId: current.member.id });
        }
        else if (previous.channelId !== current.channelId) {
            if (existingTask) {
                existingTask.updateData({ guildId: current.guild.id, channelId: current.channelId, memberId: current.member.id });
            }
            else {
                await this._createNewTask({ guildId: current.guild.id, channelId: current.channelId, memberId: current.member.id });
            }
        }

        return;
    }
}
