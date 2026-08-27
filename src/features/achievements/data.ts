import { Achievement, AchievementKeys } from "../../core/types";

export const achievementData: Record<AchievementKeys, Achievement> = {
  "Hello_Bloxd": {
    description: "hellobloxd",
    explanation: "Bloxdをプレイする",
    parent: null,
    icon: "award",
    isSecret: false,
    isGoal: false
  },
  "mine_stone": {
    description: "石器時代",
    explanation: "真新しいツルハシで石を採掘する",
    parent: "Hello_Bloxd",
    icon: "angle-up",
    isSecret: false,
    isGoal: false
  },
  "upgrade_tools": {
    description: "アップグレ一ド",
    explanation: "より良いツルハシをつくる",
    parent: "mine_stone",
    icon: "angles-up",
    isSecret: false,
    isGoal: false
  },
  "smelt_iron": {
    description: "金属を手に入れる",
    explanation: "鉄インゴット手に入れる",
    parent: "upgrade_tools",
    icon: "gem",
    isSecret: false,
    isGoal: false
  },
  "obtain_armor": {
    description: "装備せよ",
    explanation: "鉄の防具で身を守る",
    parent: "smelt_iron",
    icon: "shield-halved",
    isSecret: false,
    isGoal: false
  },
  "iron_tools": {
    description: "鉄のつるはしで決まり",
    explanation: "黒曜石を手に入れる",
    parent: "smelt_iron",
    icon: "hammer",
    isSecret: false,
    isGoal: false
  },
  "mine_diamond": {
    description: "ダイヤモンド",
    explanation: "ダイヤモンドを手に入れる",
    parent: "iron_tools",
    icon: "gem",
    isSecret: false,
    isGoal: false
  },
  "shiny_gear": {
    description: "ダイヤモンドで私を覆って",
    explanation: "ダイヤモンドの防具は命を救います",
    parent: "mine_diamond",
    icon: "shield",
    isSecret: false,
    isGoal: false
  },
  "Get_Moonstone": {
    description: "深淵に秘されし物",
    explanation: "ム一ンスト一ンを手に入れる",
    parent: "iron_tools",
    icon: "star",
    isSecret: false,
    isGoal: true
  },
  // --- 冒険／戦闘 ---
  "adventure": {
    description: "冒険",
    explanation: "冒険/探索/戦闘",
    parent: null,
    icon: "folder-image",
    isSecret: false,
    isGoal: false
  },
  "shoot_arrow": {
    description: "狙いを定めて",
    explanation: "弓と矢で何かを撃つ",
    parent: "adventure",
    icon: "crosshairs",
    isSecret: false,
    isGoal: false
  },
  "from_zero": {
    description: "ゼロから",
    explanation: "今までを捨て、新しい人生を歩く",
    parent: "adventure",
    icon: "clock-rotate-left",
    isSecret: false,
    isGoal: false
  },
  "TryingAgainAndAgain": {
    description: "何度も終わらぬ挑戦",
    explanation: "短時間で5回倒される",
    parent: "adventure",
    icon: "clock-rotate-left",
    isSecret: true,
    isGoal: false
  },
  // --- 農業 ---
  "husbandry": {
    description: "農業",
    explanation: "この世界は友達と食べ物でいっぱいです",
    parent: "Hello_Bloxd",
    icon: "cookie",
    isSecret: false,
    isGoal: false
  },
  "plant_seed": {
    description: "種だらけの場所",
    explanation: "種を植え、成長を観察する",
    parent: "husbandry",
    icon: "cookie",
    isSecret: false,
    isGoal: false
  },
  // --- 隠し・世界イベント ---
  "nightmare": {
    description: "悪夢",
    explanation: "ウェンディゴと出逢う",
    parent: "Hello_Bloxd",
    icon: "eye",
    isSecret: false,
    isGoal: false
  },
  "beyond_the_nightmare": {
    description: "悪夢を超えて",
    explanation: "ウェンディゴを倒す",
    parent: "nightmare",
    icon: "award",
    isSecret: false,
    isGoal: true
  },
  "nightmareIsNotOverYet": {
    description: "早く始末しなかったのが悪いんだ",
    explanation: "悪夢の再来",
    parent: "nightmare",
    icon: "location-xmark",
    isSecret: false,
    isGoal: false
  },
  //
  "frozenInquisitor": {
    description: "厳寒の審問者",
    explanation: "イグニアスと対峙する",
    parent: "Hello_Bloxd",
    icon: "shield-halved",
    isSecret: false,
    isGoal: false
  },
  "melting": {
    description: "融解",
    explanation: "イグニアスを撃破する",
    parent: "frozenInquisitor",
    icon: "person-falling-burst",
    isSecret: true,
    isGoal: false
  },
};