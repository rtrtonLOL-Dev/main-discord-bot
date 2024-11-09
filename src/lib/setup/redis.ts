import { container } from '@sapphire/pieces';
import { type RedisClientType, createClient } from 'redis';
import * as RedisUtil from '@/lib/util/redis';

const { REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST } = process.env

const cache: RedisClientType = createClient({
    url: `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}`
});

await cache.connect();

container.cache =  {
    client: cache,
    ...RedisUtil
};
