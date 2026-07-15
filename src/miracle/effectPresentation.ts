import type { NormalBallTraitDef } from "./types";

export function getNormalTraitSummaryHtml(traits: NormalBallTraitDef[]): string {
    return traits.map((trait) => `<li><b>${trait.label}</b>: ${trait.description}</li>`).join("");
}

export function getCommentaryLineHtml(params: { message: string; isMobile: boolean; displayMs: number }): string {
    return `<div style="position:absolute;white-space:nowrap;left:100vw;bottom:0;padding:4px 16px;border-radius:999px;background:rgba(15,23,42,.74);color:#fff;font-weight:900;font-size:${params.isMobile ? "18px" : "16px"};line-height:1.4;text-shadow:0 2px 8px rgba(0,0,0,.45);box-shadow:0 8px 22px rgba(0,0,0,.22);transition:transform ${params.displayMs}ms linear;">${params.message}</div>`;
}

export function pickCelebrationEffect(random: () => number): { name: string; icon: string } {
    const icons = [
        "🎆",
        "💥",
        "🌊",
        "🎂",
        "👍",
        "⚡",
        "🐶",
        "🐱",
        "⭐",
        "🔥",
        "🪐",
        "🎉",
        "🌈",
        "🦊",
        "🐸",
        "🦄",
        "🍀",
        "🍙",
        "🍜",
        "🍤",
        "🍣",
        "🥁",
        "🎺",
        "🎸",
        "🪩",
        "🛸",
        "🚀",
        "🌋",
        "🗿",
        "👺",
        "🥷",
        "🧊",
        "🫧",
        "🌪️",
        "☄️",
        "🌕",
        "🌞",
        "🦖",
        "🐉",
        "🦕",
    ];
    const prefixes = [
        "大",
        "超",
        "激",
        "謎",
        "夢",
        "夜",
        "朝",
        "山",
        "海",
        "森",
        "宇宙",
        "古代",
        "未来",
        "昭和",
        "平成",
        "令和",
        "無音",
        "爆速",
        "低速",
        "ぬるぬる",
    ];
    const suffixes = [
        "花火",
        "爆発",
        "祭り",
        "旋風",
        "波動",
        "祝福",
        "行進",
        "ダンス",
        "点滅",
        "ジャンプ",
        "拍手",
        "覚醒",
        "降臨",
        "乱舞",
        "パレード",
        "お祝い",
        "びっくり",
        "フィーバー",
        "チャンス",
        "ミラクル",
    ];
    const i = Math.floor(random() * icons.length);
    const prefix = prefixes[Math.floor(random() * prefixes.length)];
    const suffix = suffixes[Math.floor(random() * suffixes.length)];
    return { icon: icons[i], name: `${prefix}${suffix}` };
}

export function getFullScreenCelebrationHtml(params: {
    count: number;
    background: string;
    effect: { name: string; icon: string };
}): string {
    return `
        <div style="position:absolute;inset:0;background:${params.background};backdrop-filter:blur(4px);"></div>
        <div style="position:relative;z-index:2;padding:30px;border-radius:30px;background:rgba(255,255,255,0.22);box-shadow:0 24px 70px rgba(0,0,0,0.32);animation:celeb-main-pop 2s ease-out forwards;">
            <style>@keyframes celeb-main-pop{0%{transform:scale(.72);opacity:0}18%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:0}}</style>
            <div style="font-size:clamp(70px,17vw,180px);line-height:1;">${params.effect.icon}</div>
            <div style="margin-top:14px;font-size:clamp(30px,8vw,96px);font-weight:900;color:white;text-shadow:0 6px 22px rgba(0,0,0,.45);">${params.count.toLocaleString()}回達成！</div>
            <div style="margin-top:8px;font-size:clamp(20px,4vw,46px);font-weight:800;color:white;text-shadow:0 4px 16px rgba(0,0,0,.42);">${params.effect.name} 演出</div>
        </div>`;
}

export function getLifeQuoteHtml(params: { text: string; isMobile: boolean }): string {
    return `<div style="font-size:${params.isMobile ? "26px" : "34px"};font-weight:1000;line-height:1.7;text-shadow:0 3px 18px rgba(0,0,0,.55);">${params.text}</div>`;
}

export function getMiracleOverlayHtml(params: {
    iconHtml: string;
    label: string;
    probabilityText: string;
    feelingText: string;
    comboText: string;
    repeatedText: string;
    durationSec: number;
}): string {
    return `
        <div style="max-width:900px;animation:miracle-pop ${params.durationSec.toFixed(2)}s ease-out forwards;">
            <style>@keyframes miracle-pop{0%{transform:scale(.65);opacity:0}15%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:0}}</style>
            ${params.iconHtml}
            <div style="font-size:clamp(36px,8vw,90px);font-weight:900;margin-top:12px;text-shadow:0 8px 30px rgba(0,0,0,.6);">${params.label} 発生</div>
            <div style="font-size:clamp(22px,4vw,44px);font-weight:900;margin-top:12px;">${params.probabilityText}</div>
            <div style="font-size:clamp(18px,3vw,32px);margin-top:12px;opacity:.94;line-height:1.5;">${params.feelingText}</div>
            ${params.comboText}
            ${params.repeatedText}
        </div>`;
}
