import json
import random
from dataclasses import asdict, dataclass, field
from pathlib import Path


SAVE_PATH = Path("save.json")


REALM_SEQUENCE = [
    "凡人",
    "炼气一层",
    "炼气二层",
    "炼气三层",
    "炼气四层",
    "炼气五层",
    "炼气六层",
    "炼气七层",
    "炼气八层",
    "炼气九层",
    "筑基初期",
    "筑基中期",
    "筑基后期",
]


@dataclass
class Character:
    name: str
    realm_index: int = 0
    hp: int = 100
    max_hp: int = 100
    spirit: int = 60
    max_spirit: int = 60
    attack: int = 12
    defense: int = 6
    cultivation: int = 0
    cultivation_needed: int = 100
    stones: int = 30
    reputation: int = 0
    days: int = 1
    inventory: dict = field(
        default_factory=lambda: {
            "回气丹": 2,
            "小还丹": 2,
            "聚灵丹": 1,
            "破境丹": 0,
        }
    )

    @property
    def realm(self) -> str:
        return REALM_SEQUENCE[self.realm_index]

    def clamp(self) -> None:
        self.hp = max(0, min(self.hp, self.max_hp))
        self.spirit = max(0, min(self.spirit, self.max_spirit))


class Game:
    def __init__(self) -> None:
        self.player: Character | None = None

    def run(self) -> None:
        self.print_title()
        while True:
            choice = input("\n1. 新建角色\n2. 读取存档\n3. 退出\n> ").strip()
            if choice == "1":
                self.player = self.create_character()
                break
            if choice == "2":
                if self.load_game():
                    break
            if choice == "3":
                print("修行未始，道途暂歇。")
                return
            print("输入无效。")

        self.main_loop()

    def print_title(self) -> None:
        print("=" * 42)
        print("      凡人流文字修仙 · 终端原型")
        print("=" * 42)

    def create_character(self) -> Character:
        name = input("请输入角色名：").strip() or "韩立"
        char = Character(name=name)
        print(f"\n{name}出身寒微，身具五灵根，正式踏入修仙路。")
        return char

    def load_game(self) -> bool:
        if not SAVE_PATH.exists():
            print("当前没有存档。")
            return False
        try:
            data = json.loads(SAVE_PATH.read_text(encoding="utf-8"))
            self.player = Character(**data)
            print(f"已读取存档：{self.player.name}，当前境界 {self.player.realm}")
            return True
        except Exception as exc:
            print(f"读取存档失败：{exc}")
            return False

    def save_game(self) -> None:
        if not self.player:
            return
        SAVE_PATH.write_text(
            json.dumps(asdict(self.player), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print("已保存存档。")

    def main_loop(self) -> None:
        while self.player and self.player.hp > 0:
            self.show_status()
            print(
                "\n1. 闭关修炼\n2. 外出历练\n3. 尝试突破\n4. 使用物品\n5. 查看背包\n6. 保存游戏\n7. 结束本次修行"
            )
            choice = input("> ").strip()
            if choice == "1":
                self.cultivate()
            elif choice == "2":
                self.adventure()
            elif choice == "3":
                self.breakthrough()
            elif choice == "4":
                self.use_item()
            elif choice == "5":
                self.show_inventory()
            elif choice == "6":
                self.save_game()
            elif choice == "7":
                self.save_game()
                print("你暂时离开洞府，等待下次再入修途。")
                return
            else:
                print("输入无效。")

        if self.player and self.player.hp <= 0:
            print(f"{self.player.name}道途中陨落，修仙界再无此人。")

    def show_status(self) -> None:
        p = self.player
        if not p:
            return
        print("\n" + "-" * 42)
        print(
            f"第{p.days}日 | {p.name} | 境界：{p.realm} | 声望：{p.reputation} | 灵石：{p.stones}"
        )
        print(
            f"气血：{p.hp}/{p.max_hp} | 灵力：{p.spirit}/{p.max_spirit} | 攻击：{p.attack} | 防御：{p.defense}"
        )
        print(f"修为：{p.cultivation}/{p.cultivation_needed}")

    def cultivate(self) -> None:
        p = self.player
        if not p:
            return
        p.days += 3
        spirit_cost = random.randint(8, 16)
        gain = random.randint(18, 35) + p.realm_index * 3
        if p.spirit < spirit_cost:
            print("灵力不足，强行吐纳反伤经脉。")
            p.hp -= 8
        else:
            p.spirit -= spirit_cost
            p.cultivation += gain
            print(f"你闭关三日，吐纳天地灵气，修为增加 {gain}。")
        if random.random() < 0.25:
            restored = random.randint(8, 15)
            p.spirit += restored
            print(f"洞府灵脉涌动，额外恢复灵力 {restored}。")
        p.clamp()

    def adventure(self) -> None:
        p = self.player
        if not p:
            return
        p.days += 2
        event = random.choices(
            ["battle", "treasure", "merchant", "trap"],
            weights=[45, 20, 15, 20],
            k=1,
        )[0]
        if event == "battle":
            self.start_battle()
        elif event == "treasure":
            stones = random.randint(12, 35)
            cult = random.randint(10, 22)
            p.stones += stones
            p.cultivation += cult
            print(f"你在荒山废洞中寻得灵石 {stones}，并从残碑中领悟修为 {cult}。")
        elif event == "merchant":
            self.merchant_event()
        else:
            dmg = random.randint(10, 22)
            p.hp -= dmg
            print(f"你误入瘴气沼泽，损失气血 {dmg}。")
        p.clamp()

    def start_battle(self) -> None:
        p = self.player
        if not p:
            return
        enemy = self.generate_enemy()
        print(f"你遭遇了{enemy['name']}。")

        while enemy["hp"] > 0 and p.hp > 0:
            print(
                f"\n你的气血 {p.hp}/{p.max_hp}，灵力 {p.spirit}/{p.max_spirit} | 对手气血 {enemy['hp']}"
            )
            action = input("1. 攻击 2. 术法 3. 服药撤战\n> ").strip()
            if action == "1":
                damage = max(1, p.attack + random.randint(0, 6) - enemy["defense"])
                enemy["hp"] -= damage
                print(f"你一剑斩出，造成 {damage} 点伤害。")
            elif action == "2":
                if p.spirit < 10:
                    print("灵力不足，术法未能成型。")
                else:
                    p.spirit -= 10
                    damage = max(4, p.attack + 10 + random.randint(0, 8) - enemy["defense"])
                    enemy["hp"] -= damage
                    print(f"你祭出法术，造成 {damage} 点伤害。")
            elif action == "3":
                if p.inventory.get("小还丹", 0) > 0:
                    p.inventory["小还丹"] -= 1
                    p.hp += 25
                    p.clamp()
                    print("你服下小还丹，借机遁走。")
                    return
                print("你没有小还丹，无法强行脱战。")
            else:
                print("输入无效。")
                continue

            if enemy["hp"] > 0:
                enemy_damage = max(1, enemy["attack"] + random.randint(0, 5) - p.defense)
                p.hp -= enemy_damage
                print(f"{enemy['name']}反击，造成 {enemy_damage} 点伤害。")
                p.clamp()

        if p.hp > 0:
            reward_stones = enemy["stones"]
            reward_cult = enemy["cultivation"]
            p.stones += reward_stones
            p.cultivation += reward_cult
            p.reputation += enemy["reputation"]
            if random.random() < enemy["pill_drop_rate"]:
                p.inventory["破境丹"] += 1
                print("你在对方遗物中得到一枚破境丹。")
            print(
                f"你斩杀{enemy['name']}，获得灵石 {reward_stones}、修为 {reward_cult}、声望 {enemy['reputation']}。"
            )

    def generate_enemy(self) -> dict:
        p = self.player
        realm_bias = p.realm_index if p else 0
        templates = [
            ("山匪头目", 45, 9, 3, 12, 12, 1, 0.05),
            ("散修", 55, 12, 4, 16, 18, 2, 0.1),
            ("妖狼", 65, 14, 5, 18, 22, 2, 0.12),
            ("邪修", 75, 17, 6, 26, 28, 3, 0.18),
        ]
        name, hp, attack, defense, stones, cult, rep, drop = random.choice(templates)
        scale = 1 + realm_bias * 0.08
        return {
            "name": name,
            "hp": int(hp * scale),
            "attack": int(attack * scale),
            "defense": int(defense * scale),
            "stones": int(stones * scale),
            "cultivation": int(cult * scale),
            "reputation": rep,
            "pill_drop_rate": drop,
        }

    def merchant_event(self) -> None:
        p = self.player
        if not p:
            return
        print("你遇到一名云游商人。")
        print("1. 花 20 灵石购买聚灵丹\n2. 花 35 灵石购买小还丹 x2\n3. 离开")
        choice = input("> ").strip()
        if choice == "1":
            if p.stones >= 20:
                p.stones -= 20
                p.inventory["聚灵丹"] += 1
                print("你买下一枚聚灵丹。")
            else:
                print("灵石不足。")
        elif choice == "2":
            if p.stones >= 35:
                p.stones -= 35
                p.inventory["小还丹"] += 2
                print("你买下两枚小还丹。")
            else:
                print("灵石不足。")
        else:
            print("你没有停留太久。")

    def breakthrough(self) -> None:
        p = self.player
        if not p:
            return
        if p.realm_index >= len(REALM_SEQUENCE) - 1:
            print("你已站在当前版本可达境界尽头。")
            return
        if p.cultivation < p.cultivation_needed:
            print("修为积累不足，贸然突破只会伤身。")
            return

        base_rate = max(0.35, 0.7 - p.realm_index * 0.03)
        if p.inventory.get("破境丹", 0) > 0:
            use = input("是否消耗 1 枚破境丹提升成功率？(y/n)\n> ").strip().lower()
            if use == "y":
                p.inventory["破境丹"] -= 1
                base_rate += 0.2
                print("药力化开，经脉更加稳固。")

        p.days += 5
        p.cultivation -= p.cultivation_needed
        if random.random() < base_rate:
            p.realm_index += 1
            p.max_hp += 18
            p.max_spirit += 12
            p.attack += 4
            p.defense += 2
            p.hp = p.max_hp
            p.spirit = p.max_spirit
            p.cultivation_needed = int(p.cultivation_needed * 1.45)
            p.reputation += 5
            print(f"突破成功，你已踏入 {p.realm}。")
        else:
            backlash = random.randint(10, 20)
            p.hp -= backlash
            p.spirit -= 12
            print(f"突破失败，经脉受损，损失气血 {backlash}。")
            p.clamp()

    def use_item(self) -> None:
        p = self.player
        if not p:
            return
        self.show_inventory()
        choice = input("输入要使用的物品名：").strip()
        if p.inventory.get(choice, 0) <= 0:
            print("该物品数量不足。")
            return

        if choice == "回气丹":
            p.spirit += 25
            print("你服下回气丹，灵力恢复 25。")
        elif choice == "小还丹":
            p.hp += 30
            print("你服下小还丹，气血恢复 30。")
        elif choice == "聚灵丹":
            gain = 45
            p.cultivation += gain
            print(f"你炼化聚灵丹，修为增加 {gain}。")
        elif choice == "破境丹":
            print("破境丹需在突破时使用。")
            return
        p.inventory[choice] -= 1
        p.clamp()

    def show_inventory(self) -> None:
        p = self.player
        if not p:
            return
        print("\n背包：")
        for item, count in p.inventory.items():
            print(f"- {item} x{count}")


if __name__ == "__main__":
    Game().run()
