import { container } from "@sapphire/pieces";
import { imageToBase64, readAssetFile } from "@/lib/util/files";
import { htmlFunctions } from "@/lib/util/html";

const { div, img, a, th, tr, td } = htmlFunctions;

export function getResetTime(reset: Date, includeDays: boolean = false) {
    const nowSeconds = new Date().getTime() / 1000;
    const resetSeconds = reset.getTime() / 1000

    const remainingSeconds = Math.floor(resetSeconds - nowSeconds);

    if (remainingSeconds <= 0) {
        return `00:00:00`;
    }

    const seconds = Math.floor(remainingSeconds % 60).toString().padStart(2, '0');
    const minutes = Math.floor((remainingSeconds % 3600) / 60).toString().padStart(2, '0');

    if (!includeDays) {
        const hours = Math.floor(remainingSeconds / 3600).toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    const hours = Math.floor((remainingSeconds / 3600) % 24).toString().padStart(2, '0');
    const days = Math.floor(remainingSeconds / 86400).toString().padStart(2, '0');

    return `${days}:${hours}:${minutes}:${seconds}`;
}

export async function generateClassicShop(options: {
    resetTime: string;
    items: {
        thumbnail: string;
        name: string;
        price: number;
    }[];
}) {
    const html = readAssetFile('/assets/html/classic-shop.html');

    if (!html) {
        throw new Error('Something went wrong with generating the classic shop image.');
    }

    const content = options.items.map((i) =>
        div({ class: "shop-item" }, [
            img({ src: i.thumbnail !== ""
                ? i.thumbnail
                : "https://www.roblox.com/Thumbs/unapproved.png"
            }),
            a({ class: "item-header"}, [i.name]),
            a({ class: "item-cost" }, [`Ca$h: ${i.price}`])
        ])
    ).join('');

    const image = await container.imageProcessor.draw({
        transparency: true,
        html, handlebars: {
            shopResetTime: options.resetTime,
            shopContentHtml: content
        }
    });

    return image;
}

export async function generateOaklandsLeaderboard<T extends string>(options: {
    title: string;
    resetTime: string;
    columns: T[];
    rows: { [key in T]: {
        value: string;
        customProperties?: object;
    }}[];
}) {
    const html = readAssetFile('/assets/html/oaklands-leaderboard.html');

    if (!html) {
        throw new Error('Something went wrong with generating an oaklands leaderboard image.');
    }

    const columns = options.columns.map((c) =>
        th({ class: "column-item", scope: "column" }, [c.toUpperCase()])
    ).join('');
    
    const rows = options.rows.map((r) => {
        const rowValues = Object.entries(r) as [T, { value: string, customProperties?: any }][];
        
        return tr({ class: "leaderboard-item" }, [
            Object.values(rowValues).map(([_k, v]) =>
                td({ class: "row-item", ...(v.customProperties || {}) }, [v.value])
            ).join('')
        ]);
    }).join('');

    const image = await container.imageProcessor.draw({
        transparency: true,
        html, handlebars: {
            leaderboardTitle: options.title,
            leaderboardTimer: options.resetTime,
            leaderboardColumns: columns,
            leaderboardRows: rows
        }
    });

    return image;
}

export async function generateRankUpNotice(options: {
    message: string;
    background?: {
        path?: string;
        color?: `#${string}`;
    }
    role: {
        name: string;
        color: `#${string}`;
    }
}) {
    const html = readAssetFile('/assets/html/rank-up.html');
    
    if (!html) {
        throw new Error('Something went wrong with generating an oaklands leaderboard image.');
    }

    const image = await container.imageProcessor.draw({
        transparency: true,
        html, handlebars: {
            roleColor: options.role.color,
            roleName: options.role.name,
            descriptionText: options.message,
            backgroundColor: options?.background?.color || '#0E0911',
            backgroundImage: options?.background?.path
                ? imageToBase64(options?.background.path)
                : imageToBase64('/assets/images/default.png')
        }
    });

    return image;
}

export async function generateProfileCard(options: {
    displayName: string;
    username: string;
    avatar: string;
    activity: {
        chat: {
            rank: number;
            currentProgress: number;
            requiredProgress: number;
            totalPoints: number;
        };
        voice: {
            rank: number;
            currentProgress: number;
            requiredProgress: number;
            totalPoints: number;
        };
    };
}) {
    const html = readAssetFile('/assets/html/profile-card.html');

    if (!html) {
        throw new Error('Something went wrong with generating the classic shop image.');
    }

    const image = await container.imageProcessor.draw({
        transparency: true,
        html, handlebars: {
            bgGradientTop: '#0E0911',
            bgGradientBottom: '#0E0911',
            progressGradientLeft: '#FD9C66',
            progressGradientRight: '#A44DFA',
            backgroundImage: imageToBase64('/assets/images/default.png'),
            userAvatar: options.avatar,
            displayName: options.displayName,
            userMention: options.username,
            chatRank: options.activity.chat.rank,
            voiceRank: options.activity.voice.rank,
            totalChatPoints: options.activity.chat.totalPoints,
            totalVoicePoints: options.activity.voice.totalPoints,
            chatProgress: options.activity.chat.requiredProgress <= options.activity.chat.currentProgress
                ? options.activity.chat.totalPoints.toString()
                : `${options.activity.chat.currentProgress} / ${options.activity.chat.requiredProgress}`,
            voiceProgress: options.activity.voice.requiredProgress <= options.activity.voice.currentProgress
                ? options.activity.voice.totalPoints.toString()
                : `${options.activity.voice.currentProgress} / ${options.activity.voice.requiredProgress}`,
            chatProgressPercent: 
                options.activity.chat.requiredProgress > options.activity.chat.currentProgress
                ? Math.ceil((100 * options.activity.chat.currentProgress) / options.activity.chat.requiredProgress)
                : 100,
            voiceProgressPercent: 
                options.activity.voice.requiredProgress > options.activity.voice.currentProgress
                ? Math.ceil((100 * options.activity.voice.currentProgress) / options.activity.voice.requiredProgress)
                : 100,
        }
    });

    return image;
}