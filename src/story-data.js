import { EVENT_CONFIG, MONSTER_CONFIG } from "./game-data.js";

const NODE_NAME_TO_ID = {
  无名后山: "backhill",
  凡俗集镇: "town",
  迷雾黑原: "moor",
};

export const CHAPTER_MONSTERS = MONSTER_CONFIG.map((monster) => ({
  ...monster,
  nodeId: NODE_NAME_TO_ID[monster.nodeName] || "backhill",
}));

const EVENT_VILLAGE_GOSSIPS = EVENT_CONFIG.filter((event) => event.id.startsWith("E_6001_"))
  .map((event) => event.text)
  .filter(Boolean);

export const VILLAGE_GOSSIPS = EVENT_VILLAGE_GOSSIPS.length
  ? EVENT_VILLAGE_GOSSIPS
  : [
      "村长抽着旱烟叹气：“隔壁二狗子去了镇上的野狼帮，以后怕是刀口舔血咯。”",
      "猎户张大叔神色慌张：“后山深处最近总有野兽惨叫，还有怪异红光，千万别往深处走！”",
      "王婶压低嗓音：“昨夜后山起雾时，我看见有人提着灯往坟地里去，像不是活人。”",
    ];

export const STORY_TEXT = {
  opening:
    "你揉了揉发胀的脑袋醒来。今年你已经16岁了，作为青石村的普通农家子弟，你一生的轨迹似乎一眼就能望到头。",
  bloodFate:
    EVENT_CONFIG.find((event) => event.id === "E_6002_Main1")?.text ||
    "你在追逐猎物时滑入隐蔽山洞。洞内弥漫着血腥味，前方躺着两具僵硬的尸体！一具穿着武林劲装，心口被烧穿；另一具穿着青色道袍，脖子被砍断。道袍尸体旁掉落着一个带血的包裹。",
  pawnHint:
    "你将发光的石头递给朝奉。老朝奉看清后猛地一哆嗦：“小兄弟，你身上有微弱的灵气...这是仙家灵石。这凡间留不住你，一直往北走，穿过迷雾黑原，去修仙者集市太南谷吧。但黑原凶险，切记备好连弩防身！”",
  awakening:
    "你站在阵法外，浓郁的灵气让你浑身舒泰。突然！你怀中那灰扑扑小物件疯狂发热，贪婪吸收灵气！石皮剥落，光芒大作！",
};
