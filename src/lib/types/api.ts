export interface GuildSettings {
    chat_activity: {
        enabled: boolean;
        grant_amount: number;
        cooldown: number;
        deny_roles: string[];
        activity_roles: {
            role_id: string;
            required_points: number;
        }[];
    };
    voice_activity: {
        enabled: boolean;
        grant_amount: number;
        cooldown: number;
        deny_roles: string[];
        activity_roles: {
            role_id: string;
            required_points: number;
        }[];
    };
    spawn_rooms: {
        channel_id: string;
        user_limit: number;
        can_rename: boolean;
        can_lock: boolean;
        can_adjust_limit: boolean;
    }[];
}

export interface MemberProfile {
    rank: number;
    card_style: number;
    chat_activity: {
        last_grant: string;
        rank: number;
        points: number;
        remaining_progress: number;
        current_roles: {
            role_id: string;
            required_points: number;
        }[] | never[];
        next_role: {
            role_id: string;
            required_points: number;
        } | null;
    };
    voice_activity: {
        last_grant: string;
        rank: number;
        points: number;
        remaining_progress: number;
        current_roles: {
            role_id: string;
            required_points: number;
        }[] | never[];
        next_role: {
            role_id: string;
            required_points: number;
        } | null;
    };
}

export interface ActiveVoiceRoom {
    origin_channel_id: string;
    channel_id: string;
    original_owner_id: string;
    current_owner_id: string;
    is_locked: boolean;
}