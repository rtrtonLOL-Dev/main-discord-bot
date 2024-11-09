import { err, Listener } from '@sapphire/framework';
import { ScheduledTaskEvents, type ScheduledTask } from '@sapphire/plugin-scheduled-tasks'
import { ApplyOptions } from '@sapphire/decorators';
import type TaskError from '@/lib/extensions/TaskError';

@ApplyOptions<Listener.Options>({
    event: ScheduledTaskEvents.ScheduledTaskError,
    once: false
})
export class TaskErrorSentry extends Listener {
    public override async run(error: TaskError, _: ScheduledTask) {
        if (!this.container.client.isReady()) return; // Such as channels not existing.

        const taskList = await this.container.tasks.client.getJobs(['active' ,'delayed' ,'prioritized' ,'waiting' ,'waiting-children']);

        switch (true) {
            case error.task === 'IncrementVoiceActivity':
                const task = taskList.find((j) => (j.data as any)?.memberId === error.payload.memberId);
                if (task) this.container.tasks.client.removeJobScheduler(task.repeatJobKey!);
                break;
        }
    }
}
