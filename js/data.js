// デモ用のアセットデータ
// tags が空のアセットは「未タグ」として最初の画面に表示される
window.TAG_DEMO_DATA = (() => {
  const A = (name, type, tags = []) => ({ name, type, tags });

  const assets = [
    // Environment
    A("SM_Rock_01", "StaticMesh", ["Environment", "Rock", "Forest"]),
    A("SM_Rock_02", "StaticMesh", ["Environment", "Rock", "Forest"]),
    A("SM_Rock_Desert_01", "StaticMesh", ["Environment", "Rock", "Desert"]),
    A("T_Rock_D", "Texture", ["Environment", "Rock"]),
    A("T_Rock_N", "Texture", ["Environment", "Rock"]),
    A("M_Rock", "Material", ["Environment", "Rock"]),
    A("SM_Tree_Oak", "StaticMesh", ["Environment", "Tree", "Forest"]),
    A("SM_Tree_Pine", "StaticMesh", ["Environment", "Tree", "Forest"]),
    A("M_Leaves", "Material", ["Environment", "Tree"]),
    A("T_Bark_D", "Texture", ["Environment", "Tree"]),
    A("SM_Cactus", "StaticMesh", ["Environment", "Desert"]),
    A("SM_Pillar_Broken", "StaticMesh", ["Environment", "Dungeon"]),
    A("M_Water_Lake", "Material", ["Environment", "Water"]),
    A("M_Master_Landscape", "Material", ["Environment"]),
    A("L_Forest", "Level", ["Environment", "Forest"]),
    A("L_Desert", "Level", ["Environment", "Desert"]),
    A("L_Dungeon", "Level", ["Environment", "Dungeon"]),

    // Props / VFX
    A("SM_Torch", "StaticMesh", ["Prop", "Dungeon", "Fire"]),
    A("SM_Chest", "StaticMesh", ["Prop", "Dungeon"]),
    A("SM_Barrel", "StaticMesh", ["Prop"]),
    A("NS_TorchFire", "Niagara", ["VFX", "Fire", "Dungeon"]),
    A("NS_Campfire", "Niagara", ["VFX", "Fire", "Forest"]),
    A("NS_Waterfall", "Niagara", ["VFX", "Water", "Forest"]),
    A("NS_Sandstorm", "Niagara", ["VFX", "Desert"]),
    A("NS_Explosion", "Niagara", ["VFX", "Fire"]),

    // Characters
    A("SK_Hero", "SkeletalMesh", ["Character", "Player"]),
    A("BP_Hero", "Blueprint", ["Character", "Player"]),
    A("ABP_Hero", "AnimBlueprint", ["Character", "Player"]),
    A("A_Hero_Idle", "Animation", ["Character", "Player"]),
    A("A_Hero_Run", "Animation", ["Character", "Player"]),
    A("A_Hero_Attack", "Animation", ["Character", "Player", "Weapon"]),
    A("SK_Goblin", "SkeletalMesh", ["Character", "Enemy", "Forest"]),
    A("BP_Goblin", "Blueprint", ["Character", "Enemy", "Forest"]),
    A("SK_Mummy", "SkeletalMesh", ["Character", "Enemy", "Desert"]),
    A("BP_EnemyBase", "Blueprint", ["Character", "Enemy"]),
    A("SK_Dragon", "SkeletalMesh", ["Character", "Enemy", "Boss", "Dungeon"]),
    A("BP_Dragon", "Blueprint", ["Character", "Enemy", "Boss", "Dungeon"]),
    A("SK_Merchant", "SkeletalMesh", ["Character", "NPC"]),
    A("BP_Merchant", "Blueprint", ["Character", "NPC"]),

    // Weapons
    A("SM_Sword_Iron", "StaticMesh", ["Prop", "Weapon"]),
    A("SM_Bow", "StaticMesh", ["Prop", "Weapon"]),
    A("SM_Sword_Legend", "StaticMesh", ["Prop", "Weapon", "Boss"]),

    // UI
    A("T_Icon_Sword", "Texture", ["UI", "Icon", "Weapon"]),
    A("T_Icon_Potion", "Texture", ["UI", "Icon"]),
    A("T_Icon_Coin", "Texture", ["UI", "Icon"]),
    A("WBP_MainMenu", "WidgetBlueprint", ["UI", "Menu"]),
    A("WBP_Inventory", "WidgetBlueprint", ["UI", "Menu"]),
    A("WBP_HUD", "WidgetBlueprint", ["UI", "Player"]),

    // Audio
    A("S_Footstep_Grass", "Sound", ["Audio", "Footstep", "Forest"]),
    A("S_Footstep_Sand", "Sound", ["Audio", "Footstep", "Desert"]),
    A("S_Footstep_Stone", "Sound", ["Audio", "Footstep", "Dungeon"]),
    A("S_BGM_Forest", "Sound", ["Audio", "BGM", "Forest"]),
    A("S_BGM_Boss", "Sound", ["Audio", "BGM", "Boss"]),
    A("S_Sword_Swing", "Sound", ["Audio", "Weapon"]),
    A("S_UI_Click", "Sound", ["Audio", "UI"]),

    // 未タグ（インポート直後・作業中など）
    A("NewMaterial", "Material"),
    A("NewBlueprint", "Blueprint"),
    A("T_Temp_0423", "Texture"),
    A("SM_Cube_Test", "StaticMesh"),
    A("S_Untitled", "Sound"),
    A("NS_Test_Sparks", "Niagara"),
  ];

  // アセットタイプの表示名と色（UE のアセットカラーを意識）
  const types = {
    StaticMesh: { label: "Static Mesh", color: "#26b8e8" },
    SkeletalMesh: { label: "Skeletal Mesh", color: "#e85ec6" },
    Material: { label: "Material", color: "#5fcf5f" },
    Texture: { label: "Texture", color: "#e04848" },
    Blueprint: { label: "Blueprint Class", color: "#3f7cf2" },
    AnimBlueprint: { label: "Animation Blueprint", color: "#f07c3a" },
    WidgetBlueprint: { label: "Widget Blueprint", color: "#3fa6c8" },
    Animation: { label: "Animation Sequence", color: "#36c9a3" },
    Sound: { label: "Sound Wave", color: "#9a6af0" },
    Niagara: { label: "Niagara System", color: "#f2a41e" },
    Level: { label: "Level", color: "#e8c23a" },
  };

  return { assets, types };
})();
