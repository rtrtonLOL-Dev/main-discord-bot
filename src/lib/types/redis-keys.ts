import type {
    GuildSettings,
    MemberProfile,
    ActiveVoiceRoom
} from "@/lib/types/api";

export interface RedisKeys {
    /** Settings for a specific guild. */
    [key: `settings_${string}`]: GuildSettings;
    /** The profile for a specific member in a specific guild. */
    [key: `member-profile_${string}:${string}`]: MemberProfile;
    /** The information for an active voice room in a specific guild. */
    [key: `voice-room_${string}:${string}`]: ActiveVoiceRoom;
}
