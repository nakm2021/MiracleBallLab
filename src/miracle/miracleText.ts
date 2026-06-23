import type { SpecialEventDef } from "./types";

function randomPick(items: string[], random: () => number): string {
    return items[Math.floor(random() * items.length)] ?? items[0] ?? "";
}

export function getProbabilityDangerText(denominator: number): string {
    if (denominator >= 1_000_000_000) return "確率のヤバさ：日常ではなく伝説。出たら画面を二度見してください。";
    if (denominator >= 10_000_000) return "確率のヤバさ：運営に確認したくなる級。ほぼ都市伝説です。";
    if (denominator >= 1_000_000) return "確率のヤバさ：もう事件。普通に動画のオチになります。";
    if (denominator >= 100_000) return "確率のヤバさ：長時間回してやっと会えるかも、くらいです。";
    if (denominator >= 10_000) return "確率のヤバさ：普通にレア。出たらちょっと勝ちです。";
    return "確率のヤバさ：まあまあ珍しい。小さめの奇跡です。";
}

export function buildWeirdMiracleText(def: SpecialEventDef, random: () => number): string {
    const weird = [
        `${def.label}が出ました。研究員が一瞬だけ敬語になりました。`,
        `${def.label}を観測。確率が廊下で正座しています。`,
        `これは${def.label}です。ブラウザの中で小さい祭りが始まりました。`,
        `${def.label}発生。普通の玉たちが見なかったことにしています。`,
        `${def.label}です。たぶん今日の運を少し前借りしました。`,
        `${def.label}を確認。捨て区間まで静かに拍手しています。`,
        `${def.label}が来ました。乱数が変な汗をかいています。`,
        `${def.label}。現実が3フレームだけ読み込み直されました。`,
        `${def.label}です。主任が「サンプル数を増やせ」と言っています。`,
        `${def.label}観測。これはもう玉ではなく事件です。`,
    ];
    return `${randomPick(weird, random)}<br>${getProbabilityDangerText(def.denominator)}`;
}
