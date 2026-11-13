export const LANGUAGES = ['ja', 'en', 'zh', 'ko'] as const;
export type Lang = typeof LANGUAGES[number];

export type TrObj = Record<Lang,TrStr>;
export type TrData = Record<string,TrObj>;
export type TrKey = keyof typeof trData;
export type TrStr = string;

export const trData :TrData = {
    // deleteable, not-used
    "language": {
        "ja": "日本語",
        "en": "英語",
        "zh": "中国語",
        "ko": "韓国語",
    },

    "rodEnd": {
        "ja": "杖",
        "en": " Wand",
        "zh": "杖",
        "ko": " 지팡이"
    }
};

export function getTrObj (trKey :TrKey) :TrObj { 
    return trData[trKey];
}
export function getTr (trKey :TrKey, lang: Lang) :TrStr {
    return trData[trKey][lang];
}

export function setTr (trKey :TrKey, data: TrObj) {
    trData[trKey] = data;
}
export function setTrs (addTrData :TrData) {
    Object.assign(trData, addTrData);
}

type LangWithBefore = Lang | "before";
type WandData = Record<LangWithBefore,TrStr>;

// Rodなどの共通部分を削除して後から一括で追加することも可能。
const wands :WandData[] = [
  {
    "before": "Rusty Rod",
    "ja": "魔法の木の杖",
    "en": "Magic Wood Wand",
    "zh": "魔法木之杖",
    "ko": "마법 나무 지팡이"
  },
  {
    "before": "Lucky Rod",
    "ja": "過魔力の木の杖",
    "en": "Over Mana Wood Wand",
    "zh": "过魔力木之杖",
    "ko": "과마력 나무 지팡이"
  },
  {
    "before": "Sturdy Rod",
    "ja": "老樹の杖",
    "en": "Old Tree Wand",
    "zh": "老树之杖",
    "ko": "노목 지팡이"
  },
  {
    "before": "Jungle Rod",
    "ja": "世界樹の杖",
    "en": "World Tree Wand",
    "zh": "世界树之杖",
    "ko": "세계수 지팡이"
  },
  {
    "before": "Draugr Rod",
    "ja": "不気味な闇の杖",
    "en": "Uncanny Dark Wand",
    "zh": "诡异暗之杖",
    "ko": "기분 나쁜 어둠의 지팡이"
  },
  {
    "before": "Cursed Rod",
    "ja": "呪詛師の杖",
    "en": "Curse User's Wand",
    "zh": "诅咒师之杖",
    "ko": "저주술사의 지팡이"
  },
  {
    "before": "Tangle Resistant Rod",
    "ja": "最古の杖職人の杖",
    "en": "Oldest Wand Creator Wand",
    "zh": "最古制杖师之杖",
    "ko": "태고의 지팡이 장인의 지팡이"
  },
  {
    "before": "Speed Rod",
    "ja": "時の杖",
    "en": "Time Wand",
    "zh": "时之杖",
    "ko": "시간의 지팡이"
  },
  {
    "before": "Carbon Rod",
    "ja": "魔鐵の杖",
    "en": "Magic Iron Wand",
    "zh": "魔铁之杖",
    "ko": "마철 지팡이"
  },
  {
    "before": "Deep Sea Rod",
    "ja": "深海の主の杖",
    "en": "Deep Sea Master Wand",
    "zh": "深海之主之杖",
    "ko": "심해의 주인의 지팡이"
  },
  {
    "before": "Master Rod",
    "ja": "聖なる意匠の込められた金の杖",
    "en": "Sacred-Engraved Golden Wand",
    "zh": "刻有圣洁意匠的金之杖",
    "ko": "성스러운 문양이 새겨진 황금 지팡이"
  },
  {
    "before": "Obsidian Rod",
    "ja": "緋の灯る闇の杖",
    "en": "Crimson-Lit Dark Wand",
    "zh": "绯红点亮的暗之杖",
    "ko": "진홍빛이 감도는 어둠의 지팡이"
  },
  {
    "before": "Molten Magma Rod",
    "ja": "溶けた憎悪の火の杖",
    "en": "Melted Hatred Fire Wand",
    "zh": "熔化憎恶之火杖",
    "ko": "녹아내린 증오의 불 지팡이"
  },
  {
    "before": "Frost Rod",
    "ja": "凍てつく吹雪の杖",
    "en": "Freezing Snowstorm Wand",
    "zh": "凛冽暴雪之杖",
    "ko": "얼어붙은 눈보라의 지팡이"
  },
  {
    "before": "Black Ice Rod",
    "ja": "恨みの黒氷の杖",
    "en": "Rancor Black Ice Wand",
    "zh": "怨恨黑冰之杖",
    "ko": "원한의 흑빙 지팡이"
  },
  {
    "before": "Mythic Rod",
    "ja": "天使の翼を纏う杖",
    "en": "Angel-Winged Wand",
    "zh": "缠绕天使之翼的杖",
    "ko": "천사의 날개를 두른 지팡이"
  }
];
wands.forEach((wand)=>{
    const { before, ...translations } = wand;
    setTr(before,translations);
});