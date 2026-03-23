import { MONSTER_CONFIG } from "./game-data.js";

const NODE_NAME_TO_ID = {
  无名后山: "backhill",
  凡俗集镇: "town",
  迷雾黑原: "moor",
};

export const CHAPTER_MONSTERS = MONSTER_CONFIG.map((monster) => ({
  ...monster,
  nodeId: NODE_NAME_TO_ID[monster.nodeName] || "backhill",
}));

export const VILLAGE_GOSSIPS = [
  "村长抽着旱烟叹气：“隔壁二狗子去了镇上的野狼帮，以后怕是刀口舔血咯。”",
  "猎户张大叔神色慌张：“后山深处最近总有野兽惨叫，还有怪异红光，千万别往深处走！”",
  "王婶压低嗓音：“昨夜后山起雾时，我看见有人提着灯往坟地里去，像不是活人。”",
];

export const STORY_TEXT = {
  opening:
    "你揉了揉发胀的脑袋醒来。今年你已经16岁了，作为青石村的普通农家子弟，你一生的轨迹似乎一眼就能望到头。",
  bloodFate:
    "你在追逐猎物时滑入隐蔽山洞。洞内弥漫着血腥味，前方躺着两具僵硬的尸体！一具穿着武林劲装，心口被烧穿；另一具穿着青色道袍，脖子被砍断。道袍尸体旁掉落着一个带血的包裹。",
  pawnHint:
    "你将发光的石头递给朝奉。老朝奉看清后猛地一哆嗦：“小兄弟，你身上有微弱的灵气...这是仙家灵石。这凡间留不住你，一直往北走，穿过迷雾黑原，去修仙者集市太南谷吧。但黑原凶险，切记备好连弩防身！”",
  awakening:
    "你站在阵法外，浓郁的灵气让你浑身舒泰。突然！你怀中那灰扑扑小物件疯狂发热，贪婪吸收灵气！石皮剥落，光芒大作！",
};

export const ACTION_META = {
  openInventory: { label: "状态与背包" },
  openSkills: { label: "功法与神通" },
  openGoldFinger: { label: "仙缘异宝" },
  stopAction: { label: "中断/出关" },
  villageRest: { label: "回屋歇息" },
  villageChat: { label: "村口闲聊" },
  backhillSearch: { label: "进山搜寻" },
  townSell: { label: "摆摊售卖" },
  townSmith: { label: "铁匠铺" },
  townPawn: { label: "当铺探问" },
  moorTraverse: { label: "谨慎穿行" },
  move: { label: "离开此地" },
  cultivate: { label: "打坐" },
  alchemy: { label: "炼丹" },
  breakthrough: { label: "突破" },
  exportSave: { label: "导出存档" },
};
