import { Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Client, ActivityType } from 'discord.js';
import noblox, { type UniverseInformation } from 'noblox.js';

@ApplyOptions<Listener.Options>({
	event: Events.ClientReady,
	once: true
})
export class ReadyListener extends Listener {
	private oakPlaying: number = 0;
	private currentStatus: "COUNTDOWN" | "OAK_PLAYING" | "ALL_PLAYING" = "OAK_PLAYING";

	// References from https://stackabuse.com/javascript-get-number-of-days-between-dates
	private countdown(start: Date, end: Date) {
		const second = 1000;
		const minute = second * 60;
		const hour = minute * 60;
		const day = hour * 24;

		const diff = end.getTime() - start.getTime();

		const daysLeft = Math.floor(diff / day);
		const hoursLeft = Math.round(diff / hour);
		const minutesLeft = Math.round(diff / minute);
		const secondLeft = Math.round(diff / second);

		switch (true) {
			case secondLeft <= 0:
				return null;
			case secondLeft < 60:
				return secondLeft > 1 ? `${secondLeft} seconds` : `${secondLeft} second`;
			case minutesLeft < 60:
				return minutesLeft > 1 ? `${minutesLeft} minutes` : `${minutesLeft} minute`;
			case hoursLeft < 24:
				return `${hoursLeft} hours`;
			default:
				return daysLeft > 1 ? `${daysLeft} days ${hoursLeft % 24} hours` : `${daysLeft} day ${hoursLeft % 24} hours`;
		}
	}

	private async players(universe: number, oldPlaying: number) {
		const game = (await noblox.getUniverseInfo(universe).catch(() => null)) as unknown as UniverseInformation[];
		if (!game) return oldPlaying;

		let playing = game[0].playing;
		if (typeof playing !== 'number' || playing === oldPlaying) {
			return oldPlaying;
		}

		return playing;
	}

	public override async run(client: Client) {
		setInterval(async () => {
			// Using a switch-case here since it'd be easier to expand on in the future if I wanted to.
			// Would always have to update the current status to go down the line and restart but it works!
			switch (this.currentStatus) {
				case "COUNTDOWN":
					this.currentStatus = "OAK_PLAYING";

					const remaining = this.countdown(new Date(Date.now()), new Date("Dec 24, 2023 23:59:59 UTC-05:00"));
					if (remaining === null) {
						client.user?.setActivity({
							type: ActivityType.Watching,
							name: `Santa's sleigh`
						});

						return;
					}

					client.user?.setActivity({
						type: ActivityType.Watching,
						name: `for Santa・${remaining}`
					});

					return;
				case "OAK_PLAYING":
					this.currentStatus = "COUNTDOWN";

					this.oakPlaying = await this.players(3666294218, this.oakPlaying);
					client.user?.setActivity({
						type: ActivityType.Watching,
						name: `Oaklands・${this.oakPlaying} playing`
					});

					return;
				// case "ALL_PLAYING":
				// 	this.currentStatus = "OAK_PLAYING";

				// 	const total = this.oakPlaying;
				// 	client.user?.setActivity({
				// 		type: ActivityType.Watching,
				// 		name: `everything・${total} playing`
				// 	});

				// 	return;
			}
		}, 10 * 1000);

		return;
	}
}
