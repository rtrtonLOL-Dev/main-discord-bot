import { container } from "@sapphire/pieces";
import type { GuildSettings, MemberProfile, ActiveVoiceRoom } from "@/lib/types/api";

const BASE_URL = 'http://127.0.0.1:3000';

async function _requestEndpoint<Result extends Object>(
    { path, params, method, body }:
    {
        path: string;
        params?: URLSearchParams;
        method: string;
        body?: object
    }
) {
    const url = new URL(path, BASE_URL);

    if (params) {
        url.search = params.toString();
    }

    const res = await fetch(url, {
        method,
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'authorization': '727'
        },
        body: JSON.stringify(body)
    });

    // const content = res.headers.get('content-type');
    // if (!content || !content.startsWith('application/json')) throw new Error('Something went wrong when fetching the API.');

    const data: Result | { code: string; message: string; } = await res.json();

    if ('code' in data) {
        throw new Error(data.message);
    }

    return data;
}

export async function getGuildSettings(guildId: string) {
    const settings = await container.cache.get(`settings_${guildId}`);
    if (settings)
        return settings;

    const data = await _requestEndpoint<GuildSettings>({
        path: `/v1/${guildId}/settings`,
        method: "GET"
    });

    await container.cache.set(`settings_${guildId}`, data);
    return data;
}

export async function getMemberProfile(guildId: string, memberId: string) {
    const profile = await container.cache.get(`member-profile_${guildId}:${memberId}`)
    if (profile)
        return profile;

    const data = await _requestEndpoint<MemberProfile>({
        path: `/v1/${guildId}/${memberId}/profile`,
        method: "GET"
    });

    await container.cache.set(`member-profile_${guildId}:${memberId}`, data, { EX: 60 * 15 });
    return data;
}

export async function incrementMemberPoints(guildId: string, memberId: string, type: 'chat' | 'voice') {
    const data = await _requestEndpoint<MemberProfile>({
        path: `/v1/${guildId}/${memberId}/increment-points/${type}`,
        method: "PATCH"
    });

    await container.cache.set(`member-profile_${guildId}:${memberId}`, data, { EX: 60 * 15 });
    return data;
}

export async function getVoiceRoom(guildId: string, roomId: string) {
    const room = await container.cache.get(`voice-room_${guildId}:${roomId}`);
    if (room) return room;

    const data = await _requestEndpoint<ActiveVoiceRoom>({
        path: `/v1/${guildId}/voice-rooms/${roomId}`,
        method: "GET",
    }).catch(() => null);

    if (data) {
        await container.cache.set(`voice-room_${guildId}:${roomId}`, data);
    }

    return data;
}

export async function createVoiceRoom(guildId: string, originId: string, options: { ownerId: string; roomId: string; }) {
    const data = await _requestEndpoint<ActiveVoiceRoom>({
        path: `/v1/${guildId}/spawn-room/${originId}/spawn/${options.roomId}`,
        method: "POST",
        body: {
            creator_id: options.ownerId
        }
    }).catch(() => null);

    if (data) {
        await container.cache.set(`voice-room_${guildId}:${options.roomId}`, data);
    }

    return data;
}

export async function updateVoiceRoom(guildId: string, roomId: string, options: { transferOwner?: string; isLocked?: boolean; }) {
    const data = await _requestEndpoint<ActiveVoiceRoom>({
        path: `/v1/${guildId}/voice-rooms/${roomId}`,
        method: "PUT",
        body: {
            // I'll figure out how to do this better in the future.
            ...(options.transferOwner !== undefined
                ? { current_owner_id: options.transferOwner }
                : {}
            ),
            ...(options.isLocked !== undefined
                ? { is_locked: options.isLocked }
                : {}
            ),
        }
    }).catch(() => null);

    if (data) {
        await container.cache.set(`voice-room_${guildId}:${roomId}`, data);
    }
    
    return data;
}

export async function deleteVoiceRoom(guildId: string, roomId: string) {
    const data = await _requestEndpoint<{ success: boolean; }>({
        path: `/v1/${guildId}/voice-rooms/${roomId}`,
        method: "DELETE"
    }).catch(() => null);

    if (!data) return false;

    if (data.success === true) {
        await container.cache.client.del(`voice-room_${guildId}:${roomId}`);
    }

    return data.success;
}

export async function createVoiceSpawnRoom(guildId: string, originId: string, options?: { user_limit?: number; can_rename?: boolean; can_lock?: boolean; can_adjust_limit?: boolean }) {
    const settings = await getGuildSettings(guildId);
    const data = await _requestEndpoint<{
        channel_id: string;
        user_limit: number;
        can_rename: boolean;
        can_lock: boolean;
        can_adjust_limit: boolean;
    }>({
        path: `/v1/${guildId}/spawn-room/${originId}/create`,
        method: "POST",
        body: options ?? {}
    });

    if (settings) {
        settings.spawn_rooms.push(data);
        await container.cache.set(`settings_${guildId}`, settings);
    }

    return data;
}

export async function modifyVoiceSpawnRoom(guildId: string, originId: string, options: { user_limit?: number; can_rename?: boolean; can_lock?: boolean; can_adjust_limit?: boolean }) {
    const settings = await getGuildSettings(guildId);
    const data = await _requestEndpoint<{
        channel_id: string;
        user_limit: number;
        can_rename: boolean;
        can_lock: boolean;
        can_adjust_limit: boolean;
    }>({
        path: `/v1/${guildId}/spawn-room/${originId}/update`,
        method: "POST",
        body: options
    });

    if (settings) {
        const index = settings.spawn_rooms.findIndex(({ channel_id }) => channel_id === originId);
        settings.spawn_rooms.splice(index, 1);
        settings.spawn_rooms.push(data);
        
        await container.cache.set(`settings_${guildId}`, settings);
    }

    return data;
}

export async function deleteVoiceSpawnRoom(guildId: string, originId: string) {
    const settings = await getGuildSettings(guildId);
    const data = _requestEndpoint<{ success: boolean }>({
        path: `/v1/${guildId}/spawn-room/${originId}/delete`,
        method: "DELETE",
    });

    if (settings) {
        const index = settings.spawn_rooms.findIndex(({ channel_id }) => channel_id === originId);

        if (index !== -1) {
            settings.spawn_rooms.splice(index, 1);
            await container.cache.set(`settings_${guildId}`, settings);
        }
    }

    return data;
}

export async function modifyActivitySettings(guildId: string, type: 'voice' | 'chat', options: { enabled?: boolean; points?: number; cooldown?: number; }) {
    const settings = await getGuildSettings(guildId);
    const data = _requestEndpoint<{ success: boolean }>({
        path: `/v1/${guildId}/activity-tracking/${type}/options`,
        method: "POST",
        body: options
    });

    if (settings) {
        if (type === 'chat') {
            settings.chat_activity = { ...settings.chat_activity, ...options };
        }
        else if (type === 'voice') {
            settings.voice_activity = { ...settings.voice_activity, ...options };
        }

        await container.cache.set(`settings_${guildId}`, settings);
    }

    return data;
}