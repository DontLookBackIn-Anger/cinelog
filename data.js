/**
 * Initial curated media catalog across Movies, TV Shows, Anime, and Variety Shows.
 */
(function (global) {
  const CATEGORIES = [
    { id: "movie",   name: "电影",   icon: "🎬", color: "#f59e0b", desc: "大银幕光影时刻" },
    { id: "tv",      name: "电视剧", icon: "📺", color: "#38bdf8", desc: "沉浸追剧时光" },
    { id: "anime",   name: "动漫",   icon: "🌸", color: "#f472b6", desc: "二次元奇幻与感动" },
    { id: "variety", name: "综艺",   icon: "🎤", color: "#34d399", desc: "下饭解压与欢笑" },
  ];

  const INITIAL_ITEMS = [
    // ================= 电影 =================
    {
      id: "m1",
      category: "movie",
      title: "星际穿越",
      originalTitle: "Interstellar",
      year: 2014,
      rating: 5,
      status: "watched",
      date: "2026-10-12",
      tags: ["科幻", "诺兰", "硬核", "神级配乐"],
      review: "爱是唯一可以超越时间与空间的事物。五维书架与对接旋转的镜头每次重温依然起鸡皮疙瘩。",
      paletteKey: "cosmos",
      posterUrl: ""
    },
    {
      id: "m2",
      category: "movie",
      title: "盗梦空间",
      originalTitle: "Inception",
      year: 2010,
      rating: 5,
      status: "watched",
      date: "2026-09-20",
      tags: ["悬疑", "科幻", "烧脑"],
      review: "层层嵌套的梦境架构堪称教科书级别，最后的陀螺留白让人回味无穷。",
      paletteKey: "cobalt",
      posterUrl: ""
    },
    {
      id: "m3",
      category: "movie",
      title: "花样年华",
      originalTitle: "In the Mood for Love",
      year: 2000,
      rating: 5,
      status: "watched",
      date: "2026-08-15",
      tags: ["爱情", "王家卫", "美学"],
      review: "克制又浓烈的情感，旗袍、雨夜、楼梯间，每一帧都是流动的油画。",
      paletteKey: "sunset",
      posterUrl: ""
    },
    {
      id: "m4",
      category: "movie",
      title: "沙丘 2",
      originalTitle: "Dune: Part Two",
      year: 2024,
      rating: 5,
      status: "watched",
      date: "2026-07-08",
      tags: ["史诗", "科幻", "视听盛宴"],
      review: "巨物美学与声效的极致体现，保罗驯服沙虫那段在大银幕看简直震撼。",
      paletteKey: "autumn",
      posterUrl: ""
    },
    {
      id: "m5",
      category: "movie",
      title: "白日梦想家",
      originalTitle: "The Secret Life of Walter Mitty",
      year: 2013,
      rating: 4,
      status: "watched",
      date: "2026-06-11",
      tags: ["治愈", "冒险", "旅行"],
      review: "滑板冲下冰岛公路的画面太自由了，适合在疲惫的时候看一遍给自己充电。",
      paletteKey: "emerald",
      posterUrl: ""
    },
    {
      id: "m6",
      category: "movie",
      title: "奥本海默",
      originalTitle: "Oppenheimer",
      year: 2023,
      rating: 4,
      status: "wishlist",
      date: "",
      tags: ["传记", "历史", "剧情"],
      review: "计划找个安静的周末完整重刷一遍导演剪辑氛围。",
      paletteKey: "noir",
      posterUrl: ""
    },

    // ================= 电视剧 =================
    {
      id: "t1",
      category: "tv",
      title: "漫长的季节",
      originalTitle: "The Long Season",
      year: 2023,
      rating: 5,
      status: "watched",
      date: "2026-10-01",
      tags: ["悬疑", "国产神剧", "年代"],
      review: "往前看，别回头。配乐、剪辑和演员演技全员封神，后劲太大了。",
      paletteKey: "autumn",
      posterUrl: ""
    },
    {
      id: "t2",
      category: "tv",
      title: "绝命毒师",
      originalTitle: "Breaking Bad",
      year: 2008,
      rating: 5,
      status: "watched",
      date: "2026-08-29",
      tags: ["犯罪", "美剧天花板", "剧情"],
      review: "从老实化学老师到海森堡的蜕变，剧本严密得像化学方程式一样精准。",
      paletteKey: "emerald",
      posterUrl: ""
    },
    {
      id: "t3",
      category: "tv",
      title: "请回答1988",
      originalTitle: "Reply 1988",
      year: 2015,
      rating: 5,
      status: "watched",
      date: "2026-07-22",
      tags: ["治愈", "亲情", "青春"],
      review: "双门洞的烟火气永远温暖，每一集都能笑着笑着就看哭了。",
      paletteKey: "sunset",
      posterUrl: ""
    },
    {
      id: "t4",
      category: "tv",
      title: "人生切割术",
      originalTitle: "Severance",
      year: 2022,
      rating: 5,
      status: "watching",
      date: "2026-11-18",
      tags: ["科幻", "职场", "悬疑"],
      review: "把工作记忆和生活记忆物理切割的设定太绝妙了，第二季节奏依然紧张。",
      paletteKey: "cobalt",
      posterUrl: ""
    },
    {
      id: "t5",
      category: "tv",
      title: "三体",
      originalTitle: "Three-Body",
      year: 2023,
      rating: 4,
      status: "watched",
      date: "2026-05-14",
      tags: ["科幻", "悬疑", "原著还原"],
      review: "对原著氛围还原得非常扎实，古筝行动和宇宙闪烁段落很带感。",
      paletteKey: "cosmos",
      posterUrl: ""
    },
    {
      id: "t6",
      category: "tv",
      title: "重启人生",
      originalTitle: "Brush Up Life",
      year: 2023,
      rating: 5,
      status: "watched",
      date: "2026-04-19",
      tags: ["日剧", "喜剧", "友情"],
      review: "轻松又细腻的女性友谊故事，笨蛋节奏的碎碎念日常怎么看都不腻。",
      paletteKey: "sakura",
      posterUrl: ""
    },

    // ================= 动漫 =================
    {
      id: "a1",
      category: "anime",
      title: "葬送的芙莉莲",
      originalTitle: "Frieren: Beyond Journey's End",
      year: 2023,
      rating: 5,
      status: "watched",
      date: "2026-10-28",
      tags: ["奇幻", "治愈", "慢节奏"],
      review: "勇者击败魔王之后的故事。关于时间、告别与重逢的温柔诗篇，作画和配乐顶级。",
      paletteKey: "violet",
      posterUrl: ""
    },
    {
      id: "a2",
      category: "anime",
      title: "千与千寻",
      originalTitle: "Spirited Away",
      year: 2001,
      rating: 5,
      status: "watched",
      date: "2026-09-05",
      tags: ["宫崎骏", "奇幻", "经典"],
      review: "海上列车驶过浅海的画面永远是心头白月光，不同年纪看都有新的感悟。",
      paletteKey: "sakura",
      posterUrl: ""
    },
    {
      id: "a3",
      category: "anime",
      title: "进击的巨人",
      originalTitle: "Attack on Titan",
      year: 2013,
      rating: 5,
      status: "watched",
      date: "2026-07-30",
      tags: ["热血", "史诗", "悬疑"],
      review: "宏大的世界观与伏笔回收，立体机动装置的作画和泽野弘之配乐燃爆。",
      paletteKey: "noir",
      posterUrl: ""
    },
    {
      id: "a4",
      category: "anime",
      title: "孤独摇滚！",
      originalTitle: "Bocchi the Rock!",
      year: 2022,
      rating: 5,
      status: "watched",
      date: "2026-06-25",
      tags: ["音乐", "搞笑", "日常"],
      review: "波奇酱社恐发作的颜艺演出创意拉满，Live 演出段落热血又好听！",
      paletteKey: "neon",
      posterUrl: ""
    },
    {
      id: "a5",
      category: "anime",
      title: "迷宫饭",
      originalTitle: "Delicious in Dungeon",
      year: 2024,
      rating: 4,
      status: "watching",
      date: "2026-11-12",
      tags: ["美食", "冒险", "奇幻"],
      review: "魔物料理做得比现实食物还诱人，越往迷宫深处走世界观越硬核。",
      paletteKey: "emerald",
      posterUrl: ""
    },
    {
      id: "a6",
      category: "anime",
      title: "命运石之门",
      originalTitle: "Steins;Gate",
      year: 2011,
      rating: 5,
      status: "watched",
      date: "2026-03-18",
      tags: ["科幻", "时间穿越", "神作"],
      review: "熬过前期的铺垫，中后期转折直接封神！El Psy Kongroo。",
      paletteKey: "cosmos",
      posterUrl: ""
    },

    // ================= 综艺 =================
    {
      id: "v1",
      category: "variety",
      title: "明星大侦探",
      originalTitle: "Who's the Murderer",
      year: 2016,
      rating: 5,
      status: "watched",
      date: "2026-10-16",
      tags: ["推理", "悬疑", "下饭"],
      review: "恐怖童谣和酒店惊魂至今是国产推理综艺的天花板，嘉宾化学反应太好了。",
      paletteKey: "stage",
      posterUrl: ""
    },
    {
      id: "v2",
      category: "variety",
      title: "一年一度喜剧大赛",
      originalTitle: "Super Sketch Show",
      year: 2021,
      rating: 5,
      status: "watched",
      date: "2026-09-09",
      tags: ["喜剧", "解压", "Sketch"],
      review: "《互联网体检》《少爷和我》看一遍笑一遍，打工人周末最佳电子布洛芬。",
      paletteKey: "sunset",
      posterUrl: ""
    },
    {
      id: "v3",
      category: "variety",
      title: "乐队的夏天",
      originalTitle: "The Big Band",
      year: 2019,
      rating: 4,
      status: "watched",
      date: "2026-08-03",
      tags: ["音乐", "摇滚", "现场"],
      review: "认识了好多宝藏乐队，新裤子、痛仰和五条人的现场太有生命力了。",
      paletteKey: "neon",
      posterUrl: ""
    },
    {
      id: "v4",
      category: "variety",
      title: "地球娱乐室",
      originalTitle: "Earth Arcade",
      year: 2022,
      rating: 5,
      status: "watching",
      date: "2026-11-20",
      tags: ["韩综", "爆笑", "罗PD"],
      review: "四个女孩精力无限，每次把罗PD整到崩溃都笑得停不下来。",
      paletteKey: "sakura",
      posterUrl: ""
    },
    {
      id: "v5",
      category: "variety",
      title: "花儿与少年·丝路季",
      originalTitle: "Divas Hit the Road",
      year: 2023,
      rating: 4,
      status: "watched",
      date: "2026-06-02",
      tags: ["旅行", "治愈", "群像"],
      review: "北斗七行氛围太舒服了，没有刻意制造矛盾，看他们游学旅行很治愈。",
      paletteKey: "emerald",
      posterUrl: ""
    }
  ];

  const NOTE_TYPES = [
    { id: "review",  label: "深度影评", icon: "✍️" },
    { id: "note",    label: "观影随笔", icon: "📝" },
    { id: "quote",   label: "台词摘录", icon: "💬" },
    { id: "summary", label: "阶段总结", icon: "📚" },
  ];

  const INITIAL_NOTES = [
    {
      id: "n1",
      type: "review",
      title: "为什么《星际穿越》隔了十年依然是最浪漫的硬科幻",
      mediaId: "m1",
      date: "2026-10-13",
      tags: ["诺兰", "配乐", "时间"],
      content: "重温《星际穿越》时，最打动我的不再只是黑洞奇观或米勒星球的巨浪，而是库珀在飞船里一口气看完跨越 23 年的录像那段。\n\n汉斯·季默的管风琴把宇宙的宏大与孤寂推向极致，但影片真正的核心却是最朴素的父女羁绊。科学边界之外，爱是唯一能让我们跨越维度保持联结的引力。"
    },
    {
      id: "n2",
      type: "quote",
      title: "《葬送的芙莉莲》里那些温柔又戳心的瞬间",
      mediaId: "a1",
      date: "2026-10-29",
      tags: ["治愈", "台词", "时间"],
      content: "“哪怕只有百分之一的改变，只要能稍微多了解人类一点就好了。”\n\n这部番最迷人的地方在于它不急着制造冲突，而是用慢悠悠的旅途告诉你：真正改变我们的，往往是当时觉得微不足道的日常。"
    },
    {
      id: "n3",
      type: "note",
      title: "《漫长的季节》：东北秋天的金黄与宿命感",
      mediaId: "t1",
      date: "2026-10-02",
      tags: ["国产剧", "剪辑", "转场"],
      content: "前几集以为是轻喜剧，越往后看越沉重。最神的是最后一集火车驶过玉米地时，年老的王响对着年轻的自己大喊“往前看，别回头”。\n\n有些漫长的季节，真的需要用半辈子才能走出来。"
    }
  ];

  global.CineData = {
    CATEGORIES,
    INITIAL_ITEMS,
    NOTE_TYPES,
    INITIAL_NOTES,
  };
})(window);
