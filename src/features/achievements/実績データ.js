setData("achievementData", {
  "Hello_Bloxd": { //✅️
    description: "hellobloxd",
    explanation: "Bloxdをプレイする",
    parent: null,
    saveSlot: 0,
    icon: "award",
    isSecret: false,
    isGoal: false
  },
  "mine_stone": { //✅️
    description: "石器時代",
    explanation: "真新しいツルハシで石を採掘する",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "angle-up",
    isSecret: false,
    isGoal: false
  },
  "upgrade_tools": { //✅️
    description: "アップグレ一ド",
    explanation: "より良いツルハシをつくる",
    parent: "mine_stone",
    saveSlot: 0,
    icon: "angles-up",
    isSecret: false,
    isGoal: false
  },
  "smelt_iron": { //✅️
    description: "金属を手に入れる",
    explanation: "鉄インゴット手に入れる",
    parent: "upgrade_tools",
    saveSlot: 0,
    icon: "gem",
    isSecret: false,
    isGoal: false
  },
  "obtain_armor": { //✅️
    description: "装備せよ",
    explanation: "鉄の防具で身を守る",
    parent: "smelt_iron",
    saveSlot: 0,
    icon: "shield-halved",
    isSecret: false,
    isGoal: false
  },
  "iron_tools": { //✅️
    description: "鉄のつるはしで決まり",
    explanation: "黒曜石を手に入れる",
    parent: "smelt_iron",
    saveSlot: 0,
    icon: "hammer",
    isSecret: false,
    isGoal: false
  },
  "mine_diamond": { //✅️
    description: "ダイヤモンド!",
    explanation: "ダイヤモンドを手に入れる",
    parent: "iron_tools",
    saveSlot: 0,
    icon: "gem",
    isSecret: false,
    isGoal: false
  },
  "shiny_gear": { //✅️
    description: "ダイヤモンドで私を覆って",
    explanation: "ダイヤモンドの防具は命を救います",
    parent: "mine_diamond",
    saveSlot: 0,
    icon: "shield",
    isSecret: false,
    isGoal: false
  },
  "Get_Moonstone": { //✅️
    description: "深淵に秘されし物",
    explanation: "ム一ンスト一ンを手に入れる",
    parent: "iron_tools",
    saveSlot: 0,
    icon: "star",
    isSecret: false,
    isGoal: true
  },
  "elytra": { //✅️
    description: "空は続くよ何処までも",
    explanation: "グライダ一を持つ",
    parent: null,
    saveSlot: 0,
    icon: "globe",
    isSecret: false,
    isGoal: true
  },
  "adventure": { //✅️
    description: "冒険",
    explanation: "冒険/探索/戦闘",
    parent: null,
    saveSlot: 0,
    icon: "folder-image",
    isSecret: false,
    isGoal: false
  },
  "shoot_arrow": { //✅️
    description: "狙いを定めて",
    explanation: "弓と矢で何かを撃つ",
    parent: "adventure",
    saveSlot: 1,
    icon: "crosshairs",
    isSecret: false,
    isGoal: false
  },
  "kill_all_mobs": { //✅️
    description: "モンスタ一狩りの達人",
    explanation: "すべてのモンスタ一を倒す",
    parent: "kill_a_mob",
    saveSlot: 2,
    icon: "eye",
    isSecret: true,
    isGoal: false
  },
  "husbandry": { //✅️
    description: "農業",
    explanation: "この世界は友達と食べ物でいっぱいです",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "cookie",
    isSecret: false,
    isGoal: false
  },
  "plant_seed": { //✅️
    description: "種だらけの場所",
    explanation: "種を植え、成長を観察する",
    parent: "husbandry",
    saveSlot: 0,
    icon: "cookie",
    isSecret: false,
    isGoal: false
  },
  "Ouch": { //✅️
    description: "いたっ",
    explanation: "ム一ンスト一ンを投げる",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "person-falling-burst",
    isSecret: false,
    isGoal: false
  },
  "snow_age": { //✅️
    description: "雪器時代",
    explanation: "雪玉を投げる",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "snowflake",
    isSecret: false,
    isGoal: false
  },
  "Old_Spice": { //✅️
    description: "我らの砦",
    explanation: "プロテク夕を設置する",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "trophy",
    isSecret: false,
    isGoal: false
  },   //戦闘や剣系
  "AwakeningSword": { //✅️
    description: "刀の目覚め",
    explanation: "初めての斬撃",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "bolt",
    isSecret: false,
    isGoal: true
  },
  "unlockSkill2": {
    description: "斬撃の修練",
    explanation: "スキル2をアンロックする",
    parent: "AwakeningSword",
    saveSlot: 0,
    icon: "lock-open",
    isSecret: false,
    isGoal: false
  },
  "unlockSkill3": {
    description: "剣豪の誇り",
    explanation: "スキル3をアンロックする",
    parent: "AwakeningSword",
    saveSlot: 0,
    icon: "lock-open",
    isSecret: false,
    isGoal: true
  },
  "parry": { //✅️
    description: "ぱりぃ!",
    explanation: "ジャストガ一ドを成功させる",
    parent: "AwakeningSword",
    saveSlot: 0,
    icon: "halved",
    isSecret: false,
    isGoal: true
  },   //ウェンディゴ
  "nightmare": { //✅️
    description: "悪夢",
    explanation: "???とデあｳ",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "eye",
    isSecret: false,
    isGoal: false
  },
  "beyond_the_nightmare": {
    description: "悪夢を超えて",
    explanation: "???を倒す",
    parent: "nightmare",
    saveSlot: 0,
    icon: "award",
    isSecret: false,
    isGoal: true
  },
  "nightmareIsNotOverYet": {
    description: "早く始末しなかったのが悪いんだ",
    explanation: "悪夢の再来",
    parent: "nightmare",
    saveSlot: 0,
    icon: "location-xmark",
    isSecret: false,
    isGoal: false
  },
  //justbreaker系
  "heavyArmoredMonster": {
    description: "重装の化け物",
    explanation: "justBreakerと対峙する",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "shield-halved",
    isSecret: false,
    isGoal: false
  },
  "goodTiming": {
    description: "見えたッ",
    explanation: "鎧を破壊する",
    parent: "heavyArmoredMonster",
    saveSlot: 0,
    icon: "person-falling-burst",
    isSecret: false,
    isGoal: false
  },
  "justBroken": {
    description: "JUSTBROKEN",
    explanation: "justBreakerを撃破する",
    parent: "goodTiming",
    saveSlot: 0,
    icon: "person-falling-burst",
    isSecret: false,
    isGoal: true
  },
  //
  "frozenInquisitor": {
    description: "厳寒の審問者",
    explanation: "イグニアスと対峙する",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "shield-halved",
    isSecret: false,
    isGoal: false
  },
  "melting": {
    description: "融解",
    explanation: "イグニアスを撃破する",
    parent: "frozenInquisitor",
    saveSlot: 0,
    icon: "person-falling-burst",
    isSecret: false,
    isGoal: true
  },
  //
  "it'llBeRainy": {
    description: "灰色の空の下で",
    explanation: "雨が降る",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "film",
    isSecret: false,
    isGoal: false
  },
  "it'llBeSnowy": {
    description: "静かな雪",
    explanation: "雪が降る",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "snowflake",
    isSecret: false,
    isGoal: false
  },
  "Into_that_breaking_dawn": {
    description: "あの夜明けに向かって",
    explanation: "x座標+100000以上へ移動する",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "globe",
    isSecret: true,
    isGoal: false
  },
  "If_I_walk_this_road_unceasingly": {
    description: "この道をずっと征けば",
    explanation: "x座標-100000以上へ移動する",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "globe",
    isSecret: true,
    isGoal: false
  },
  "Challenger'sFootprints": {
    description: "挑戦者の足跡",
    explanation: "最大ランクがUncommonの地域を訪れる",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "person-arrow-up-from-line",
    isSecret: false,
    isGoal: false
  },
  "chosenExplorer": {
    description: "選ばれし探検者",
    explanation: "最大ランクがRareの地域を訪れる",
    parent: "Challenger'sFootprints",
    saveSlot: 0,
    icon: "person-arrow-up-from-line",
    isSecret: false,
    isGoal: false
  },
  "It'sGettingDifficult": {
    description: "そろそろむずい",
    explanation: "最大ランクがEpicの地域を訪れる",
    parent: "Challenger'sFootprints",
    saveSlot: 0,
    icon: "person-arrow-up-from-line",
    isSecret: false,
    isGoal: false
  },
  "destination": {
    description: "旅の目的地",
    explanation: "最大ランクがLegendaryの地域を訪れる",
    parent: "Challenger'sFootprints",
    saveSlot: 0,
    icon: "magnifying-glass",
    isSecret: false,
    isGoal: true
  },
  "strangeDeath": {
    description: "奇妙な死",
    explanation: "なんでか知らんけど不可避の厄災に倒れる",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "block-question",
    isSecret: true,
    isGoal: false
  },
  "didYouSeeIt?": {
    description: "仕様とバグの境界は曖昧です",
    explanation: "なんでこうなったか?それはコ一ルバックに値を返すところで割り込みエラ一が発生したからだよ...",
    parent: "Hello_Bloxd",
    saveSlot: 0,
    icon: "wrench",
    isSecret: true,
    isGoal: false
  },
});