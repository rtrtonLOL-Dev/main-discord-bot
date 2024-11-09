import type { ScheduledTasks } from "@sapphire/plugin-scheduled-tasks";

export default class TaskError<T extends keyof ScheduledTasks = keyof ScheduledTasks> extends Error {
    public readonly task: T;
    public readonly payload: ScheduledTasks[T];

    constructor(options: { task: T; payload: ScheduledTasks[T], message?: string; }) {
        super(options.message || 'A task failed to run.');

        this.task = options.task;
        this.payload = options.payload;
    }
}