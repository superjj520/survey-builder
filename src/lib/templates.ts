import { Template } from './types'

export const BUILTIN_TEMPLATES: Template[] = [
  // ===== 1. MBTI 极简版 =====
  {
    id: 'tpl_mbti',
    slug: 'mbti',
    title: '你是什么型人格？',
    description: '8道题快速测出你的MBTI人格大类，找到你的社交人设标签',
    category: 'personality',
    cover_image: null,
    tags: ['MBTI', '性格', '社交'],
    is_featured: true,
    use_count: 328,
    created_at: '2024-06-01',
    settings: {
      displayMode: 'step',
      theme: {
        primaryColor: '#7C3AED',
        backgroundColor: '#ffffff',
        fontFamily: 'default',
        thankYouMessage: '你的人格画像已生成！截图分享给朋友看看吧~',
        backgroundGradient: 'linear-gradient(135deg, #f0ebf8 0%, #e8e0f0 100%)',
      },
      scoringMode: true,
      scoreRanges: [
        { min: 0, max: 10, label: '守卫者 🛡️', description: '你是可靠的守护型人格！务实、负责、注重传统，是团队中最值得信赖的存在。' },
        { min: 11, max: 20, label: '探险家 🌊', description: '你是自由的探索型人格！灵活、自发、充满好奇心，永远在寻找下一个冒险。' },
        { min: 21, max: 30, label: '外交官 🌸', description: '你是温暖的理想型人格！共情力强、富有想象力，总能感知他人的情绪。' },
        { min: 31, max: 40, label: '分析者 🧠', description: '你是理性的思考型人格！逻辑清晰、追求真理，是人群中最冷静的存在。' },
      ],
    },
    fields: [
      { id: 'mbti1', type: 'radio', label: '周末你更倾向于？', required: true, options: ['约朋友出去浪', '一个人待着充电'], optionScores: { '约朋友出去浪': 0, '一个人待着充电': 5 } },
      { id: 'mbti2', type: 'radio', label: '聚会中你通常是？', required: true, options: ['主动找人聊天', '等别人来找我', '找个角落玩手机'], optionScores: { '主动找人聊天': 0, '等别人来找我': 3, '找个角落玩手机': 5 } },
      { id: 'mbti3', type: 'radio', label: '做决定时你更依赖？', required: true, options: ['直觉和感受', '数据和逻辑'], optionScores: { '直觉和感受': 0, '数据和逻辑': 5 } },
      { id: 'mbti4', type: 'radio', label: '遇到矛盾时你会？', required: true, options: ['先照顾对方情绪', '先分析对错', '看情况再说'], optionScores: { '先照顾对方情绪': 0, '先分析对错': 5, '看情况再说': 3 } },
      { id: 'mbti5', type: 'radio', label: '你更喜欢的工作方式？', required: true, options: ['按计划一步步来', '灵活应变随机安排'], optionScores: { '按计划一步步来': 0, '灵活应变随机安排': 5 } },
      { id: 'mbti6', type: 'radio', label: '面对一个新项目你会？', required: true, options: ['先列清单和 deadline', '先感受一下再说', '有灵感再动手'], optionScores: { '先列清单和 deadline': 0, '先感受一下再说': 3, '有灵感再动手': 5 } },
      { id: 'mbti7', type: 'radio', label: '你更关注？', required: true, options: ['已经发生的事实', '未来的可能性'], optionScores: { '已经发生的事实': 0, '未来的可能性': 5 } },
      { id: 'mbti8', type: 'radio', label: '学新东西你倾向于？', required: true, options: ['从理论框架入手', '从实际操作开始', '看别人怎么做再学'], optionScores: { '从理论框架入手': 5, '从实际操作开始': 0, '看别人怎么做再学': 3 } },
    ],
  },

  // ===== 2. 恋爱人格动物 =====
  {
    id: 'tpl_love_animal',
    slug: 'love-animal',
    title: '你的恋爱人格是哪种动物？',
    description: '10个恋爱情景测试你的感情模式，看看你是猫系还是狗系恋人',
    category: 'personality',
    cover_image: null,
    tags: ['恋爱', '动物', '测试'],
    is_featured: true,
    use_count: 512,
    created_at: '2024-06-01',
    settings: {
      displayMode: 'step',
      theme: {
        primaryColor: '#EC4899',
        backgroundColor: '#ffffff',
        fontFamily: 'default',
        thankYouMessage: '你的恋爱动物人格已揭晓！快分享给 ta 看看~',
        backgroundGradient: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
      },
      scoringMode: true,
      scoreRanges: [
        { min: 0, max: 8, label: '🐱 猫系恋人', description: '你在感情中独立又优雅，需要个人空间，但靠近时很温柔。高冷是你的保护色，其实内心超级敏感。' },
        { min: 9, max: 16, label: '🐰 兔系恋人', description: '你是恋爱中的小甜心！软萌、黏人、需要安全感。虽然容易害羞，但一旦信任就会全心投入。' },
        { min: 17, max: 24, label: '🦊 狐系恋人', description: '你聪明又有魅力，懂得若即若离的艺术。在感情中有主见，不会轻易被套路，是恋爱高手。' },
        { min: 25, max: 34, label: '🐕 狗系恋人', description: '你热情、忠诚、全力付出！恋爱中超级主动，对喜欢的人毫无保留，是最温暖的陪伴型恋人。' },
        { min: 35, max: 50, label: '🦌 鹿系恋人', description: '你温柔又敏感，像森林里的小鹿一样纯净。对爱情有理想化的期待，容易被浪漫细节打动。' },
      ],
    },
    fields: [
      { id: 'la1', type: 'radio', label: '对方发消息说"在吗"，你的第一反应？', required: true, options: ['立刻秒回', '等一会儿再回', '看心情决定', '反问"怎么了"'], optionScores: { '立刻秒回': 5, '等一会儿再回': 2, '看心情决定': 1, '反问"怎么了"': 3 } },
      { id: 'la2', type: 'radio', label: '约会时对方迟到20分钟，你会？', required: true, options: ['生气但不说', '直接表达不满', '无所谓继续等', '已经走了'], optionScores: { '生气但不说': 4, '直接表达不满': 3, '无所谓继续等': 5, '已经走了': 1 } },
      { id: 'la3', type: 'radio', label: '你理想的约会方式？', required: true, options: ['一起窝在家看电影', '逛街吃饭拍照打卡', '户外冒险探索新地方', '安静地坐在咖啡馆聊天'], optionScores: { '一起窝在家看电影': 2, '逛街吃饭拍照打卡': 5, '户外冒险探索新地方': 3, '安静地坐在咖啡馆聊天': 4 } },
      { id: 'la4', type: 'radio', label: '吵架后你通常会？', required: true, options: ['主动道歉和好', '等对方先来找我', '冷战几天再说', '写长消息表达想法'], optionScores: { '主动道歉和好': 5, '等对方先来找我': 1, '冷战几天再说': 2, '写长消息表达想法': 4 } },
      { id: 'la5', type: 'radio', label: '对方和异性朋友单独吃饭，你的反应？', required: true, options: ['完全信任不在意', '嘴上说没事心里在意', '直接表明不开心', '默默观察不说话'], optionScores: { '完全信任不在意': 3, '嘴上说没事心里在意': 4, '直接表明不开心': 5, '默默观察不说话': 2 } },
      { id: 'la6', type: 'radio', label: '你对恋爱中"仪式感"的态度？', required: true, options: ['超级重要！', '有当然好没有也行', '觉得有点做作', '自己偷偷准备惊喜'], optionScores: { '超级重要！': 5, '有当然好没有也行': 3, '觉得有点做作': 1, '自己偷偷准备惊喜': 4 } },
      { id: 'la7', type: 'radio', label: '感情中你更看重？', required: true, options: ['情绪价值和浪漫', '稳定和安全感', '自由和个人空间', '共同成长和目标'], optionScores: { '情绪价值和浪漫': 5, '稳定和安全感': 4, '自由和个人空间': 1, '共同成长和目标': 3 } },
      { id: 'la8', type: 'radio', label: '你喜欢的表达爱意方式？', required: true, options: ['天天说"我爱你"', '默默为对方做事', '送礼物和惊喜', '肢体接触（牵手拥抱）'], optionScores: { '天天说"我爱你"': 5, '默默为对方做事': 3, '送礼物和惊喜': 4, '肢体接触（牵手拥抱）': 2 } },
      { id: 'la9', type: 'radio', label: '刚在一起时你是什么状态？', required: true, options: ['疯狂分享日常', '小心翼翼试探', '表面冷静内心狂喜', '马上介绍给朋友'], optionScores: { '疯狂分享日常': 5, '小心翼翼试探': 4, '表面冷静内心狂喜': 2, '马上介绍给朋友': 3 } },
      { id: 'la10', type: 'radio', label: '如果要用一个词形容你在恋爱中的样子？', required: true, options: ['温暖小太阳', '高冷小猫咪', '浪漫梦想家', '靠谱守护者'], optionScores: { '温暖小太阳': 5, '高冷小猫咪': 1, '浪漫梦想家': 4, '靠谱守护者': 3 } },
    ],
  },

  // ===== 3. 社交能量条 =====
  {
    id: 'tpl_social_energy',
    slug: 'social-energy',
    title: '你的社交能量条还剩多少？',
    description: '测测你现在的社交电量，看看你是满电社牛还是急需充电的i人',
    category: 'personality',
    cover_image: null,
    tags: ['社交', '能量', 'i人e人'],
    is_featured: true,
    use_count: 245,
    created_at: '2024-06-01',
    settings: {
      displayMode: 'step',
      theme: {
        primaryColor: '#0891B2',
        backgroundColor: '#ffffff',
        fontFamily: 'default',
        thankYouMessage: '你的社交能量报告出来了！记得按时充电哦~',
        backgroundGradient: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
      },
      scoringMode: true,
      scoreRanges: [
        { min: 0, max: 200, label: '🔋 急需充电 i 人', description: '你的社交电量已经见底了！赶紧找个安静的角落，看书/追剧/发呆，让灵魂回归。世界可以等一等，你先歇会儿。' },
        { min: 201, max: 450, label: '🔋🔋 半电观察者', description: '你处于一种微妙的平衡状态——可以社交，但请给我选择权。最舒服的状态是和熟人待在一起，不用说话也不尴尬。' },
        { min: 451, max: 700, label: '🔋🔋🔋 满电社牛', description: '你的能量条满满当当！此刻你就是人群中的发电机，越热闹越兴奋。去吧，这个世界需要你的快乐感染力！' },
      ],
    },
    fields: [
      { id: 'se1', type: 'slider', label: '今天的"想见人"程度', required: true, sliderMin: 0, sliderMax: 100, sliderStep: 1 },
      { id: 'se2', type: 'slider', label: '接到聚会邀请时的开心程度', required: true, sliderMin: 0, sliderMax: 100, sliderStep: 1 },
      { id: 'se3', type: 'slider', label: '独处时的舒适程度', required: true, sliderMin: 0, sliderMax: 100, sliderStep: 1 },
      { id: 'se4', type: 'slider', label: '和陌生人聊天的意愿', required: true, sliderMin: 0, sliderMax: 100, sliderStep: 1 },
      { id: 'se5', type: 'slider', label: '此刻如果有人打来电话你的接听意愿', required: true, sliderMin: 0, sliderMax: 100, sliderStep: 1 },
      { id: 'se6', type: 'slider', label: '对"一起出去玩"这句话的兴奋度', required: true, sliderMin: 0, sliderMax: 100, sliderStep: 1 },
      { id: 'se7', type: 'radio', label: '此刻你更想做什么？', required: true, options: ['叫上朋友出去嗨', '和好朋友视频聊天', '一个人刷手机', '关机消失一阵子'], optionScores: { '叫上朋友出去嗨': 100, '和好朋友视频聊天': 50, '一个人刷手机': 20, '关机消失一阵子': 0 } },
      { id: 'se8', type: 'radio', label: '上一次社交后你需要多久恢复？', required: true, options: ['不需要恢复，还想继续', '睡一觉就好', '需要一整天', '好几天都不想出门'], optionScores: { '不需要恢复，还想继续': 100, '睡一觉就好': 50, '需要一整天': 20, '好几天都不想出门': 0 } },
    ],
  },

  // ===== 4. 闺蜜默契大考验 =====
  {
    id: 'tpl_bestie',
    slug: 'bestie',
    title: '闺蜜默契大考验',
    description: '8道题看看你有多了解你的闺蜜！填完转发给她对答案~',
    category: 'social',
    cover_image: null,
    tags: ['闺蜜', '默契', '互动'],
    is_featured: false,
    use_count: 186,
    created_at: '2024-06-01',
    settings: {
      displayMode: 'page',
      theme: {
        primaryColor: '#F97316',
        backgroundColor: '#ffffff',
        fontFamily: 'default',
        thankYouMessage: '答案已收到！快让你的闺蜜也来填一份，看看你们的默契值~',
        backgroundGradient: 'linear-gradient(135deg, #fff7ed 0%, #fce7f3 100%)',
      },
    },
    fields: [
      { id: 'bs1', type: 'radio', label: '我最喜欢的奶茶是？', required: true, options: ['珍珠奶茶', '杨枝甘露', '芋泥波波', '美式咖啡', '柠檬茶'] },
      { id: 'bs2', type: 'radio', label: '我心情不好时通常会？', required: true, options: ['找人倾诉', '一个人哭一会儿', '疯狂购物', '暴吃一顿', '运动发泄'] },
      { id: 'bs3', type: 'text', label: '我最害怕的东西是什么？', required: true, placeholder: '写出你认为的答案...' },
      { id: 'bs4', type: 'radio', label: '我的理想周末是？', required: true, options: ['睡到自然醒宅家', '出门探店拍照', '看展/看电影', '和朋友聚餐', '运动健身'] },
      { id: 'bs5', type: 'text', label: '我最近在追什么剧/综艺？', required: true, placeholder: '写出你知道的...' },
      { id: 'bs6', type: 'radio', label: '我最受不了的事情？', required: true, options: ['迟到/被放鸽子', '不回消息', '公共场合很吵', '被人指指点点', '食物难吃'] },
      { id: 'bs7', type: 'radio', label: '如果我中了100万，第一件事会？', required: true, options: ['辞职旅行', '买房/投资', '请朋友吃大餐', '疯狂购物', '存起来不告诉任何人'] },
      { id: 'bs8', type: 'text', label: '用三个词形容我的性格', required: true, placeholder: '例如：温柔、倔强、吃货...' },
    ],
  },

  // ===== 5. 友谊等级测试 =====
  {
    id: 'tpl_friendship',
    slug: 'friendship',
    title: '我们的友谊等级测试',
    description: '10道题测出你在我心中的友谊等级，敢挑战吗？',
    category: 'social',
    cover_image: null,
    tags: ['友谊', '测试', '互动'],
    is_featured: true,
    use_count: 293,
    created_at: '2024-06-01',
    settings: {
      displayMode: 'step',
      theme: {
        primaryColor: '#6366F1',
        backgroundColor: '#ffffff',
        fontFamily: 'default',
        thankYouMessage: '友谊等级已鉴定！截图发给对方看看 ta 的反应~',
        backgroundGradient: 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%)',
      },
      scoringMode: true,
      scoreRanges: [
        { min: 0, max: 3, label: '👋 点头之交', description: '你对我的了解还停留在表面...多花点时间相处吧！' },
        { min: 4, max: 6, label: '🤝 普通朋友', description: '我们是不错的朋友，但有些秘密你还不知道哦~' },
        { min: 7, max: 8, label: '💛 好朋友', description: '你很了解我！我们之间有很好的默契和信任。' },
        { min: 9, max: 10, label: '💎 灵魂伴侣', description: '你简直是我的另一个自己！这种默契太珍贵了！' },
      ],
    },
    fields: [
      { id: 'fr1', type: 'radio', label: '我的生日是哪个月？', required: true, options: ['1-3月', '4-6月', '7-9月', '10-12月'], optionScores: { '1-3月': 0, '4-6月': 0, '7-9月': 1, '10-12月': 0 } },
      { id: 'fr2', type: 'radio', label: '我最喜欢的颜色？', required: true, options: ['蓝色/紫色系', '粉色/红色系', '黑白灰', '绿色/黄色系'], optionScores: { '蓝色/紫色系': 1, '粉色/红色系': 0, '黑白灰': 0, '绿色/黄色系': 0 } },
      { id: 'fr3', type: 'radio', label: '我是猫派还是狗派？', required: true, options: ['猫派', '狗派', '都喜欢', '都不喜欢'], optionScores: { '猫派': 1, '狗派': 0, '都喜欢': 0, '都不喜欢': 0 } },
      { id: 'fr4', type: 'radio', label: '我压力大时会做什么？', required: true, options: ['疯狂运动', '暴吃零食', '听歌发呆', '找人吐槽'], optionScores: { '疯狂运动': 0, '暴吃零食': 0, '听歌发呆': 1, '找人吐槽': 0 } },
      { id: 'fr5', type: 'radio', label: '我最怕什么？', required: true, options: ['虫子/蛇', '社死', '孤独', '被误解'], optionScores: { '虫子/蛇': 0, '社死': 0, '孤独': 1, '被误解': 0 } },
      { id: 'fr6', type: 'radio', label: '我的人生目标是？', required: true, options: ['财富自由环游世界', '有一个温暖的家', '做自己热爱的事', '出名/被认可'], optionScores: { '财富自由环游世界': 0, '有一个温暖的家': 0, '做自己热爱的事': 1, '出名/被认可': 0 } },
      { id: 'fr7', type: 'radio', label: '我最不能忍受朋友做什么？', required: true, options: ['背后说坏话', '消失不回消息', '总是迟到', '只在需要时找我'], optionScores: { '背后说坏话': 1, '消失不回消息': 0, '总是迟到': 0, '只在需要时找我': 0 } },
      { id: 'fr8', type: 'radio', label: '我最近最开心的事？', required: true, options: ['工作/学业进步', '交了新朋友', '买到想要的东西', '旅行/出去玩'], optionScores: { '工作/学业进步': 1, '交了新朋友': 0, '买到想要的东西': 0, '旅行/出去玩': 0 } },
      { id: 'fr9', type: 'radio', label: '我通常几点睡觉？', required: true, options: ['10点前', '11点左右', '12点左右', '1点以后'], optionScores: { '10点前': 0, '11点左右': 0, '12点左右': 1, '1点以后': 0 } },
      { id: 'fr10', type: 'radio', label: '我现在的手机壁纸最可能是？', required: true, options: ['风景/自然', '偶像/明星', '宠物/动物', '纯色/简约'], optionScores: { '风景/自然': 0, '偶像/明星': 0, '宠物/动物': 1, '纯色/简约': 0 } },
    ],
  },

  // ===== 6. 审美风格流派 =====
  {
    id: 'tpl_aesthetic',
    slug: 'aesthetic',
    title: '你的审美风格是什么流派？',
    description: '8道题鉴定你的审美DNA，找到最适合你的风格关键词',
    category: 'fun',
    cover_image: null,
    tags: ['审美', '风格', '穿搭'],
    is_featured: false,
    use_count: 167,
    created_at: '2024-06-01',
    settings: {
      displayMode: 'step',
      theme: {
        primaryColor: '#92400E',
        backgroundColor: '#ffffff',
        fontFamily: 'default',
        thankYouMessage: '你的审美流派已解锁！按这个方向发展准没错~',
        backgroundGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      },
      scoringMode: true,
      scoreRanges: [
        { min: 0, max: 8, label: '🖤 暗黑美学', description: '你被黑色、金属、哥特元素吸引。追求戏剧性和力量感，穿搭自带气场两米八。' },
        { min: 9, max: 16, label: '🌿 日系侘寂', description: '你偏爱自然、简素、不完美之美。棉麻材质、大地色系、留白设计是你的心头好。' },
        { min: 17, max: 24, label: '🤍 极简主义', description: '少即是多是你的信条。干净的线条、克制的配色、精致的剪裁，你的美在于高级感。' },
        { min: 25, max: 32, label: '🎀 法式浪漫', description: '你骨子里是个浪漫主义者。碎花、蕾丝、慵懒卷发，不费力的精致就是你的标签。' },
        { min: 33, max: 40, label: '🌈 美式街头', description: '你大胆、张扬、不拘一格。撞色、oversize、混搭是你的日常，穿衣就是表达态度。' },
      ],
    },
    fields: [
      { id: 'ae1', type: 'radio', label: '你被哪种颜色组合吸引？', required: true, options: ['黑白灰', '米色+大地色', '粉色+奶油色', '红蓝撞色', '全黑+金属'], optionScores: { '黑白灰': 3, '米色+大地色': 2, '粉色+奶油色': 4, '红蓝撞色': 5, '全黑+金属': 1 } },
      { id: 'ae2', type: 'radio', label: '选一种面料你最爱？', required: true, options: ['真丝/缎面', '棉麻/针织', '皮革/金属', '雪纺/蕾丝', '牛仔/帆布'], optionScores: { '真丝/缎面': 3, '棉麻/针织': 2, '皮革/金属': 1, '雪纺/蕾丝': 4, '牛仔/帆布': 5 } },
      { id: 'ae3', type: 'radio', label: '理想的房间风格？', required: true, options: ['全白+极简家具', '木质+绿植+阳光', '复古+丝绒+暖光', '工业风+铁艺', '色彩缤纷+涂鸦墙'], optionScores: { '全白+极简家具': 3, '木质+绿植+阳光': 2, '复古+丝绒+暖光': 4, '工业风+铁艺': 1, '色彩缤纷+涂鸦墙': 5 } },
      { id: 'ae4', type: 'radio', label: '你拍照最常用的滤镜风格？', required: true, options: ['黑白/高对比', '胶片/复古色调', '清新/低饱和', '明亮/高彩度', '暗调/电影感'], optionScores: { '黑白/高对比': 3, '胶片/复古色调': 4, '清新/低饱和': 2, '明亮/高彩度': 5, '暗调/电影感': 1 } },
      { id: 'ae5', type: 'radio', label: '周末逛街你会走进哪家店？', required: true, options: ['无印良品/优衣库', '& Other Stories', 'Dr. Martens', 'Urban Outfitters', 'Acne Studios'], optionScores: { '无印良品/优衣库': 2, '& Other Stories': 4, 'Dr. Martens': 1, 'Urban Outfitters': 5, 'Acne Studios': 3 } },
      { id: 'ae6', type: 'radio', label: '如果只能带一个配饰出门？', required: true, options: ['极简金属耳环', '丝巾/发带', '墨镜', '棒球帽', '多层项链'], optionScores: { '极简金属耳环': 3, '丝巾/发带': 4, '墨镜': 1, '棒球帽': 5, '多层项链': 2 } },
      { id: 'ae7', type: 'radio', label: '你的手机壳风格？', required: true, options: ['透明/纯色', '花纹/插画', '皮质/金属', '贴纸/DIY', '干脆裸机'], optionScores: { '透明/纯色': 3, '花纹/插画': 4, '皮质/金属': 1, '贴纸/DIY': 5, '干脆裸机': 2 } },
      { id: 'ae8', type: 'radio', label: '哪个词最能形容你的审美追求？', required: true, options: ['less is more', '自然随性', '精致优雅', '大胆突破', '暗黑神秘'], optionScores: { 'less is more': 3, '自然随性': 2, '精致优雅': 4, '大胆突破': 5, '暗黑神秘': 1 } },
    ],
  },

  // ===== 7. 赛博网名 =====
  {
    id: 'tpl_cyber_name',
    slug: 'cyber-name',
    title: 'AI 给你起一个赛博网名',
    description: '回答5个问题，生成属于你的独一无二赛博网名',
    category: 'fun',
    cover_image: null,
    tags: ['网名', 'AI', '趣味'],
    is_featured: false,
    use_count: 421,
    created_at: '2024-06-01',
    settings: {
      displayMode: 'step',
      theme: {
        primaryColor: '#818cf8',
        backgroundColor: '#ffffff',
        fontFamily: 'default',
        thankYouMessage: '你的赛博网名公式：[性格词] + [元素] + [星座前缀] + [颜色] + [幸运数字] = 你的专属ID！快去改名吧~',
        backgroundGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      },
    },
    fields: [
      { id: 'cn1', type: 'radio', label: '选一个最像你的性格词', required: true, options: ['孤勇者', '梦游人', '观察家', '破坏王', '治愈师', '隐士'] },
      { id: 'cn2', type: 'radio', label: '选一个你喜欢的元素', required: true, options: ['星尘', '深海', '极光', '闪电', '薄雾', '烈焰'] },
      { id: 'cn3', type: 'radio', label: '你的星座属于？', required: true, options: ['火象（白羊/狮子/射手）', '土象（金牛/处女/摩羯）', '风象（双子/天秤/水瓶）', '水象（巨蟹/天蝎/双鱼）'] },
      { id: 'cn4', type: 'radio', label: '选一个颜色', required: true, options: ['赤', '靛', '翠', '鎏金', '银灰', '绯红'] },
      { id: 'cn5', type: 'radio', label: '选一个幸运数字', required: true, options: ['7', '13', '42', '99', '0', '666'] },
    ],
  },

  // ===== 8. 活动满意度反馈 =====
  {
    id: 'tpl_event_feedback',
    slug: 'event-feedback',
    title: '活动满意度反馈',
    description: '专业的活动反馈模板，收集参与者评分和建议',
    category: 'utility',
    cover_image: null,
    tags: ['反馈', '活动', 'NPS'],
    is_featured: false,
    use_count: 89,
    created_at: '2024-06-01',
    settings: {
      displayMode: 'page',
      theme: {
        primaryColor: '#4F46E5',
        backgroundColor: '#ffffff',
        fontFamily: 'default',
        thankYouMessage: '感谢您的反馈！我们会认真阅读每条建议，持续改进活动体验。',
        backgroundGradient: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
      },
    },
    fields: [
      { id: 'ef1', type: 'nps', label: '你有多大可能向朋友推荐这个活动？', required: true, npsLeftLabel: '完全不可能', npsRightLabel: '非常愿意' },
      { id: 'ef2', type: 'rating', label: '活动内容的质量', required: true, maxRating: 5 },
      { id: 'ef3', type: 'rating', label: '活动组织和流程', required: true, maxRating: 5 },
      { id: 'ef4', type: 'rating', label: '场地/环境', required: true, maxRating: 5 },
      { id: 'ef5', type: 'radio', label: '你是通过什么渠道了解到这个活动的？', required: true, options: ['朋友推荐', '小红书', '微信公众号', '朋友圈海报', '其他'] },
      { id: 'ef6', type: 'radio', label: '你还会参加我们的下一次活动吗？', required: true, options: ['一定会！', '看情况', '可能不会'] },
      { id: 'ef7', type: 'text', label: '你的建议或想说的话', required: false, multiline: true, placeholder: '任何反馈都很珍贵...' },
    ],
  },
]

export function getTemplateBySlug(slug: string) {
  return BUILTIN_TEMPLATES.find(t => t.slug === slug)
}

export function getTemplatesWithSlug() {
  return BUILTIN_TEMPLATES.filter(t => t.slug)
}
