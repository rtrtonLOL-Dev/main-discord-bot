import { container } from '@sapphire/pieces';
import * as BotAPI from '@/lib/util/bot-api';
import * as PublicAPI from '@/lib/util/public-api';

container.api = BotAPI;
container.experience = PublicAPI;