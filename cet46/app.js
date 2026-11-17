(function () {
  "use strict";

  const STORAGE_KEY = "ciyu-cet-state-v1";
  const DAY = 86400000;
  const INTERVALS = [0, 1, 3, 7, 14, 30];
  const WORDS = (window.CET_WORDS || []).map((word) => ({
    ...word,
    id: word.word.toLowerCase()
  }));
  const WORD_MAP = new Map(WORDS.map((word) => [word.id, word]));
  const TOTAL_WORDS = WORDS.length;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const UI_TEXT = {
    zh: {
      "nav.today": "今日",
      "nav.learn": "学习",
      "nav.library": "词库",
      "nav.quiz": "测验",
      "nav.stats": "进度",
      "nav.settings": "设置",
      "title.dashboard": "{greeting}，今天也要记住单词。",
      "title.learn": "专注当下，一次一个词。",
      "title.library": "在词海里，找到你的词。",
      "title.quiz": "小测验，检验今天的记忆。",
      "title.stats": "每一小步，都算数。",
      "title.settings": "把这里，调成你喜欢的样子。",
      "common.cancel": "取消",
      "common.continue": "继续学习",
      "common.startDaily": "开始今日学习",
      "common.quickQuiz": "快速测验",
      "common.viewCard": "查看词卡",
      "sidebar.today": "今日",
      "sidebar.goal": "每日目标",
      "sidebar.note": "慢慢来，但别停下。",
      "top.streakSuffix": "天连续",
      "theme.darkMode": "深色模式",
      "theme.lightMode": "浅色模式",
      "dash.badge": "今日学习舱",
      "dash.heroLine1": "把单词，",
      "dash.heroLine2": "变成你的底气。",
      "dash.heroCopy": "不追求一次记住，只追求每天再见一面。今天的学习队列已经准备好了。",
      "dash.goal": "今日目标",
      "dash.complete": "完成",
      "dash.wordsUnit": "个单词",
      "goal.words10": "10 词",
      "goal.words20": "20 词",
      "goal.words30": "30 词",
      "goal.words40": "40 词",
      "dash.goalEmpty": "今天的第一枚单词在等你。",
      "dash.goalLeft": "还差 {count} 个单词，慢慢来。",
      "dash.goalDone": "今日目标完成，给自己一点掌声。",
      "dash.streak": "连续学习",
      "dash.seen": "已接触",
      "dash.mastered": "已掌握",
      "dash.keepGoing": "保持得不错",
      "dash.startToday": "今天开始",
      "dash.totalWords": "共 {count} 词",
      "dash.accuracy": "正确率 {value}%",
      "plan.title": "今天的学习清单",
      "plan.new": "新词初见",
      "plan.review": "到期复习",
      "plan.quiz": "10 题小测验",
      "plan.quizDesc": "用输出检验今天的输入",
      "plan.newHint": "{count} 个新词等待见面",
      "plan.newDone": "新词都打过照面了",
      "plan.reviewHint": "{count} 个词等待复习",
      "plan.reviewDone": "今天没有到期复习，轻松一点",
      "unit.days": "天",
      "unit.words": "词",
      "study.mixed": "混合",
      "study.flash": "闪卡",
      "study.spell": "拼写",
      "study.today": "今日学习",
      "study.review": "到期复习",
      "study.known": "认识",
      "study.again": "再见",
      "study.showAnswer": "显示释义",
      "study.know": "认识了",
      "study.tapReveal": "或点击卡片查看释义",
      "study.listen": "听发音",
      "study.flip": "翻面",
      "study.speaker": "点击喇叭发音",
      "study.accuracy": "本轮正确率",
      "study.toRevisit": "待巩固",
      "study.oneMore": "再学一组",
      "study.goQuiz": "去测验",
      "study.backToday": "返回今日",
      "study.spellKicker": "根据释义拼出单词",
      "study.placeholder": "输入这个单词",
      "study.check": "检查",
      "study.showMe": "想不起来？查看答案",
      "study.spellCorrect": "拼写正确，记忆 +1",
      "study.spellWrong": "差一点，再记一次",
      "study.next": "下一个",
      "study.hint": "{letter} 开头 · 共 {count} 个字母",
      "study.stage": "记忆阶段 {stage}/5",
      "modal.phrases": "常用搭配",
      "modal.stage": "记忆阶段 {stage}/5",
      "modal.nextReview": "下次复习：{value}",
      "modal.notStarted": "尚未开始",
      "modal.dueNow": "现在可以复习",
      "modal.learn": "学习这个词",
      "study.emptyExample": "试着用它造一个句子。",
      "study.emptyExampleCopy": "造句，是记住一个词最快的方式。",
      "study.finished": "{count} 个单词，收下啦。",
      "study.finishedCopy": "{know} 个认识，{again} 个再见。记忆不是一次完成的事，明天再和它们见一面。",
      "library.search": "搜索 6664 个单词、释义或例句…",
      "library.all": "全部",
      "library.allStatus": "全部状态",
      "library.new": "新词",
      "library.learning": "学习中",
      "library.wrong": "待巩固",
      "library.mastered": "已掌握",
      "library.favorite": "已收藏",
      "library.reset": "重置筛选",
      "library.more": "加载更多",
      "library.moreLeft": "还有 {count} 词",
      "library.emptyTitle": "没有找到这个词",
      "library.emptyCopy": "换一个关键词或筛选条件试试。",
      "library.clear": "清除筛选",
      "library.wordMatch": "单词匹配",
      "library.meaningMatch": "释义匹配",
      "library.exampleMatch": "例句匹配",
      "library.noMatch": "无匹配",
      "status.new": "未学习",
      "status.learning": "学习中",
      "status.mastered": "已掌握",
      "quiz.heroLine1": "认识它，",
      "quiz.heroLine2": "就从选对开始。",
      "quiz.copy": "10 道选择题，检验你与单词之间的默契。答错的词会重新回到学习队列。",
      "quiz.rulesQuestions": "道题",
      "quiz.rulesMinutes": "分钟",
      "quiz.rulesInstant": "即时",
      "quiz.rulesFeedback": "解析",
      "quiz.chooseBank": "选择词库",
      "quiz.mixed": "混合词库",
      "quiz.allWords": "全量 6664 词",
      "quiz.cet4Words": "4544 词",
      "quiz.cet6Words": "3995 词",
      "quiz.direction": "答题方向",
      "quiz.enZh": "看英文选释义",
      "quiz.zhEn": "看释义选单词",
      "quiz.codeEnZh": "EN → 中",
      "quiz.codeZhEn": "中 → EN",
      "quiz.note": "答错的词会自动进入复习队列。",
      "quiz.start": "开始挑战",
      "quiz.progress": "答题进度",
      "quiz.score": "得分",
      "quiz.quit": "退出",
      "quiz.promptEnZh": "选择最接近的释义",
      "quiz.promptZhEn": "选择对应的英文单词",
      "quiz.correct": "答对了，记忆 +1",
      "quiz.wrong": "这次没选对，再见一次就好",
      "quiz.correctAnswer": "正确答案：{answer}",
      "quiz.next": "下一题",
      "quiz.seeResult": "查看结果",
      "quiz.accuracy": "正确率",
      "quiz.newMastered": "新掌握",
      "quiz.toReview": "待复习",
      "quiz.again": "再来一轮",
      "quiz.reviewWrong": "去复习错词",
      "quiz.resultHigh": "太稳了，记忆在线。",
      "quiz.resultMid": "不错，再巩固一下。",
      "quiz.resultLow": "别急，再见几次就熟了。",
      "quiz.resultCopy": "这一轮你答对了 {score} 道题，{note}",
      "quiz.resultNoteWrong": "错词已经回到复习队列。",
      "quiz.resultNoteClear": "今天的记忆状态很不错。",
      "quiz.correctFallback": "记住它，下一次还会遇见。",
      "stats.seen": "累计接触",
      "stats.streak": "连续学习",
      "stats.accuracy": "总体正确率",
      "stats.growing": "词汇量正在一点点长出来。",
      "stats.noRecord": "今天还没有学习记录。",
      "stats.streakActive": "连续学习正在发生。",
      "stats.accuracyEmpty": "完成测验或闪卡后生成。",
      "stats.accuracyActive": "每一次选择都在塑造记忆。",
      "stats.week": "近七日学习",
      "stats.mastery": "掌握度",
      "stats.mastered": "已掌握",
      "stats.learning": "学习中",
      "stats.untouched": "未接触",
      "stats.heatmap": "学习足迹",
      "stats.heatmapSummary": "过去 5 周共学习 {count} 个单词。",
      "stats.less": "少",
      "stats.more": "多",
      "stats.manage": "管理学习数据",
      "settings.appearance": "外观",
      "settings.appearanceCopy": "选择更舒服的阅读氛围。",
      "settings.light": "浅色",
      "settings.lightCopy": "温暖纸张",
      "settings.dark": "深色",
      "settings.darkCopy": "夜间专注",
      "settings.fontSize": "阅读字号",
      "settings.fontSizeCopy": "整体放大或缩小界面",
      "settings.small": "小",
      "settings.normal": "标准",
      "settings.large": "大",
      "settings.xlarge": "特大",
      "settings.fontFamily": "字体风格",
      "settings.fontFamilyCopy": "选择阅读时的字形气质",
      "settings.fontDefault": "系统",
      "settings.fontSerif": "衬线",
      "settings.fontMono": "等宽",
      "settings.language": "界面语言",
      "settings.languageCopy": "部分界面文字中英切换",
      "settings.preferences": "学习偏好",
      "settings.preferencesCopy": "把节奏调到适合你的位置。",
      "settings.dailyGoal": "每日目标",
      "settings.dailyGoalCopy": "每天想见多少个词",
      "settings.level": "默认词库",
      "settings.levelCopy": "新一轮学习优先用它",
      "settings.mode": "默认模式",
      "settings.modeCopy": "闪卡或主动拼写",
      "settings.mixed": "混合",
      "settings.flash": "闪卡",
      "settings.spell": "拼写",
      "settings.data": "学习数据",
      "settings.dataCopy": "备份、恢复，或者重新出发。",
      "settings.seen": "已接触",
      "settings.mastered": "已掌握",
      "settings.favorites": "已收藏",
      "settings.accuracy": "正确率",
      "settings.export": "导出学习记录",
      "settings.exportCopy": "下载一份 JSON 备份",
      "settings.import": "导入学习记录",
      "settings.importCopy": "从备份恢复进度",
      "settings.clearProgress": "清空学习进度",
      "settings.clearProgressCopy": "清除单词进度、复习时间与学习足迹，收藏和设置保留。",
      "settings.clearProgressBtn": "清空进度",
      "settings.clearFavorites": "清空收藏",
      "settings.clearFavoritesCopy": "移除已收藏的单词，学习进度不受影响。",
      "settings.clearFavoritesBtn": "清空收藏",
      "settings.reset": "恢复默认设置",
      "settings.resetCopy": "重置主题、每日目标和默认学习方式，学习进度保留。",
      "settings.resetBtn": "恢复默认",
      "settings.about": "关于词屿",
      "settings.aboutCopy": "轻量、离线、只属于你的单词空间。",
      "settings.bank": "完整词库",
      "settings.bankValue": "6664 词",
      "settings.bankDetail": "CET4 4544 · CET6 3995",
      "settings.material": "学习素材",
      "settings.materialValue": "6522 例句",
      "settings.materialDetail": "5107 组常用搭配",
      "settings.storage": "数据存储",
      "settings.storageValue": "仅本地",
      "settings.storageCopy": "无需登录，不上传服务器",
      "settings.license": "词库数据来自 KyleBing/english-vocabulary，按 BSD-3-Clause 许可使用，详见 THIRD_PARTY_NOTICES.txt。",
      "footer.tagline": "词屿 · 为每一次小小的坚持留一块地方",
      "footer.data": "CET4 + CET6 去重 6664 词 · 数据源 KyleBing/english-vocabulary（BSD-3-Clause）",
      "toast.saveError": "浏览器未能保存学习记录",
      "toast.noReview": "今天没有到期需要复习的单词",
      "toast.noStudy": "这个词库暂时没有可学习的单词",
      "toast.sessionDone": "这一组学完了，做得不错",
      "toast.flipFirst": "先翻面看看释义，再做判断",
      "toast.favorited": "已加入收藏",
      "toast.unfavorited": "已取消收藏",
      "toast.noSpeech": "当前浏览器不支持语音朗读",
      "toast.quizPool": "这个词库暂时不够出题",
      "toast.noWrong": "这一轮没有错词，去学点新的吧",
      "toast.progressCleared": "学习进度已清空",
      "toast.noFavorites": "还没有收藏的单词",
      "toast.favoritesCleared": "收藏已清空",
      "toast.settingsReset": "已恢复默认设置",
      "toast.exported": "学习记录已导出",
      "toast.imported": "学习记录已导入",
      "toast.importError": "导入失败：请选择有效的学习记录文件",
      "toast.modeSpell": "已切换到拼写模式",
      "toast.modeFlash": "已切换到闪卡模式",
      "toast.goalSet": "每日目标已设为 {count} 个单词",
      "toast.levelUpdated": "默认词库已更新",
      "toast.modeUpdated": "默认学习模式已更新",
      "toast.fontSize": "阅读字号已更新",
      "toast.fontFamily": "字体风格已更新",
      "toast.dataLoadError": "词库加载失败，请刷新页面",
      "confirm.clearProgress": "确定要清空全部学习进度吗？学习足迹会被移除，收藏、主题和设置会保留。",
      "confirm.clearFavorites": "确定要清空全部收藏吗？学习进度不会受到影响。",
      "confirm.resetSettings": "恢复默认设置吗？学习进度和收藏不会受到影响。",
      "confirm.import": "导入会覆盖当前学习进度、收藏与设置，继续吗？",
      "confirm.titleProgress": "清空学习进度？",
      "confirm.titleFavorites": "清空收藏？",
      "confirm.titleSettings": "恢复默认设置？",
      "confirm.titleImport": "覆盖当前数据？",
      "confirm.metaProgress": "已学习 {learned} 词 · 收藏会保留",
      "confirm.metaFavorites": "已收藏 {count} 个单词",
      "confirm.metaSettings": "学习进度与收藏不会受影响",
      "confirm.metaImport": "当前进度、收藏与设置将被覆盖",
      "confirm.importAction": "继续导入"
    },
    en: {
      "nav.today": "Today",
      "nav.learn": "Learn",
      "nav.library": "Library",
      "nav.quiz": "Quiz",
      "nav.stats": "Progress",
      "nav.settings": "Settings",
      "title.dashboard": "{greeting}. Ready for a few words?",
      "title.learn": "Stay present. One word at a time.",
      "title.library": "Find your word in the sea.",
      "title.quiz": "A quick check for today.",
      "title.stats": "Every small step counts.",
      "title.settings": "Make this space yours.",
      "common.cancel": "Cancel",
      "common.continue": "Continue",
      "common.startDaily": "Start today's session",
      "common.quickQuiz": "Quick quiz",
      "common.viewCard": "View word card",
      "sidebar.today": "today",
      "sidebar.goal": "Daily goal",
      "sidebar.note": "Slow down, but don't stop.",
      "top.streakSuffix": "day streak",
      "theme.darkMode": "Dark mode",
      "theme.lightMode": "Light mode",
      "dash.badge": "Today's session",
      "dash.heroLine1": "Turn words",
      "dash.heroLine2": "into confidence.",
      "dash.heroCopy": "Don't chase perfect recall. Just meet them again today. Your study queue is ready.",
      "dash.goal": "Daily goal",
      "dash.complete": "done",
      "dash.wordsUnit": "words",
      "goal.words10": "10 words",
      "goal.words20": "20 words",
      "goal.words30": "30 words",
      "goal.words40": "40 words",
      "dash.goalEmpty": "Your first word is waiting.",
      "dash.goalLeft": "{count} words to go. Take your time.",
      "dash.goalDone": "Daily goal complete. A little applause for yourself.",
      "dash.streak": "Streak",
      "dash.seen": "Seen",
      "dash.mastered": "Mastered",
      "dash.keepGoing": "Keep it up",
      "dash.startToday": "Start today",
      "dash.totalWords": "{count} words in total",
      "dash.accuracy": "{value}% accuracy",
      "plan.title": "Today's study list",
      "plan.new": "New words",
      "plan.review": "Due review",
      "plan.quiz": "10-question quiz",
      "plan.quizDesc": "Test today's input with output",
      "plan.newHint": "{count} new words waiting",
      "plan.newDone": "You've met all new words",
      "plan.reviewHint": "{count} words due for review",
      "plan.reviewDone": "Nothing due today. Take it easy.",
      "unit.days": "days",
      "unit.words": "words",
      "study.mixed": "Mixed",
      "study.flash": "Flashcards",
      "study.spell": "Spelling",
      "study.today": "Today's session",
      "study.review": "Due review",
      "study.known": "Known",
      "study.again": "Again",
      "study.showAnswer": "Show meaning",
      "study.know": "I know it",
      "study.tapReveal": "or tap the card to reveal",
      "study.listen": "Listen",
      "study.flip": "flip",
      "study.speaker": "tap speaker to hear",
      "study.accuracy": "Accuracy",
      "study.toRevisit": "To revisit",
      "study.oneMore": "Another set",
      "study.goQuiz": "Take a quiz",
      "study.backToday": "Back to today",
      "study.spellKicker": "Spell the word from its meaning",
      "study.placeholder": "Type the word",
      "study.check": "Check",
      "study.showMe": "Can't recall? Show answer",
      "study.spellCorrect": "Correct. Memory +1",
      "study.spellWrong": "Almost. Let's revisit",
      "study.next": "Next",
      "study.hint": "Starts with {letter} · {count} letters",
      "study.stage": "Memory stage {stage}/5",
      "modal.phrases": "Common phrases",
      "modal.stage": "Memory stage {stage}/5",
      "modal.nextReview": "Next review: {value}",
      "modal.notStarted": "Not started",
      "modal.dueNow": "Due now",
      "modal.learn": "Study this word",
      "study.emptyExample": "Try making a sentence with it.",
      "study.emptyExampleCopy": "Making sentences is a fast way to remember.",
      "study.finished": "{count} words, done.",
      "study.finishedCopy": "{know} known, {again} to revisit. Memory grows through reunion.",
      "library.search": "Search 6664 words, meanings, or examples…",
      "library.all": "All",
      "library.allStatus": "All status",
      "library.new": "New",
      "library.learning": "Learning",
      "library.wrong": "Review",
      "library.mastered": "Mastered",
      "library.favorite": "Favorites",
      "library.reset": "Reset filters",
      "library.more": "Load more",
      "library.moreLeft": "{count} more",
      "library.emptyTitle": "No matching words",
      "library.emptyCopy": "Try another keyword or filter.",
      "library.clear": "Clear filters",
      "library.wordMatch": "word match",
      "library.meaningMatch": "meaning match",
      "library.exampleMatch": "example match",
      "library.noMatch": "no match",
      "status.new": "Not started",
      "status.learning": "Learning",
      "status.mastered": "Mastered",
      "quiz.heroLine1": "Know the word,",
      "quiz.heroLine2": "start by choosing right.",
      "quiz.copy": "10 questions to test your recall. Missed words return to your review queue.",
      "quiz.rulesQuestions": "questions",
      "quiz.rulesMinutes": "minutes",
      "quiz.rulesInstant": "instant",
      "quiz.rulesFeedback": "feedback",
      "quiz.chooseBank": "Word bank",
      "quiz.mixed": "Mixed word bank",
      "quiz.allWords": "All 6664 words",
      "quiz.cet4Words": "4544 words",
      "quiz.cet6Words": "3995 words",
      "quiz.direction": "Direction",
      "quiz.enZh": "English → Chinese",
      "quiz.zhEn": "Chinese → English",
      "quiz.codeEnZh": "EN → ZH",
      "quiz.codeZhEn": "ZH → EN",
      "quiz.note": "Missed words will be added to your review queue.",
      "quiz.start": "Start quiz",
      "quiz.progress": "Progress",
      "quiz.score": "Score",
      "quiz.quit": "Exit",
      "quiz.promptEnZh": "Choose the closest meaning",
      "quiz.promptZhEn": "Choose the matching English word",
      "quiz.correct": "Correct. Memory +1",
      "quiz.wrong": "Not this time. Meet it again.",
      "quiz.correctAnswer": "Correct answer: {answer}",
      "quiz.next": "Next",
      "quiz.seeResult": "See result",
      "quiz.accuracy": "Accuracy",
      "quiz.newMastered": "Newly mastered",
      "quiz.toReview": "To review",
      "quiz.again": "Try again",
      "quiz.reviewWrong": "Review missed words",
      "quiz.resultHigh": "Rock solid. Memory online.",
      "quiz.resultMid": "Nice. A little more practice.",
      "quiz.resultLow": "No rush. Repetition brings familiarity.",
      "quiz.resultCopy": "You got {score} right. {note}",
      "quiz.resultNoteWrong": "Missed words are back in your review queue.",
      "quiz.resultNoteClear": "Your memory looks good today.",
      "quiz.correctFallback": "Remember it. You'll meet again.",
      "stats.seen": "Words seen",
      "stats.streak": "Streak",
      "stats.accuracy": "Accuracy",
      "stats.growing": "Your vocabulary is growing.",
      "stats.noRecord": "No study record today.",
      "stats.streakActive": "Your streak is alive.",
      "stats.accuracyEmpty": "Appears after a quiz or flashcards.",
      "stats.accuracyActive": "Every choice shapes memory.",
      "stats.week": "Last 7 days",
      "stats.mastery": "Mastery",
      "stats.mastered": "Mastered",
      "stats.learning": "Learning",
      "stats.untouched": "Untouched",
      "stats.heatmap": "Consistency",
      "stats.heatmapSummary": "{count} words studied in the last 5 weeks.",
      "stats.less": "Less",
      "stats.more": "More",
      "stats.manage": "Manage data",
      "settings.appearance": "Appearance",
      "settings.appearanceCopy": "Choose a comfortable reading atmosphere.",
      "settings.light": "Light",
      "settings.lightCopy": "Warm paper",
      "settings.dark": "Dark",
      "settings.darkCopy": "Night focus",
      "settings.fontSize": "Text size",
      "settings.fontSizeCopy": "Scale the whole interface",
      "settings.small": "Small",
      "settings.normal": "Normal",
      "settings.large": "Large",
      "settings.xlarge": "Extra large",
      "settings.fontFamily": "Typeface",
      "settings.fontFamilyCopy": "Choose a reading typeface",
      "settings.fontDefault": "System",
      "settings.fontSerif": "Serif",
      "settings.fontMono": "Mono",
      "settings.language": "Language",
      "settings.languageCopy": "Switch part of the interface",
      "settings.preferences": "Learning",
      "settings.preferencesCopy": "Set a pace that fits you.",
      "settings.dailyGoal": "Daily goal",
      "settings.dailyGoalCopy": "How many words a day",
      "settings.level": "Default word bank",
      "settings.levelCopy": "Used when a new session starts",
      "settings.mode": "Default mode",
      "settings.modeCopy": "Flashcards or active spelling",
      "settings.mixed": "Mixed",
      "settings.flash": "Flashcards",
      "settings.spell": "Spelling",
      "settings.data": "Your data",
      "settings.dataCopy": "Back up, restore, or start over.",
      "settings.seen": "Seen",
      "settings.mastered": "Mastered",
      "settings.favorites": "Favorites",
      "settings.accuracy": "Accuracy",
      "settings.export": "Export progress",
      "settings.exportCopy": "Download a JSON backup",
      "settings.import": "Import progress",
      "settings.importCopy": "Restore from a backup",
      "settings.clearProgress": "Clear learning progress",
      "settings.clearProgressCopy": "Remove word progress, review dates, and activity history. Favorites and settings stay.",
      "settings.clearProgressBtn": "Clear progress",
      "settings.clearFavorites": "Clear favorites",
      "settings.clearFavoritesCopy": "Remove saved words without affecting progress.",
      "settings.clearFavoritesBtn": "Clear favorites",
      "settings.reset": "Reset preferences",
      "settings.resetCopy": "Reset theme, daily goal, and default study options. Progress stays.",
      "settings.resetBtn": "Reset",
      "settings.about": "About Ciyu",
      "settings.aboutCopy": "A light, offline space for your words.",
      "settings.bank": "Vocabulary",
      "settings.bankValue": "6664 words",
      "settings.bankDetail": "CET4 4544 · CET6 3995",
      "settings.material": "Learning material",
      "settings.materialValue": "6522 examples",
      "settings.materialDetail": "5107 collocations",
      "settings.storage": "Storage",
      "settings.storageValue": "Local only",
      "settings.storageCopy": "No sign-in. No uploads.",
      "settings.license": "Vocabulary data from KyleBing/english-vocabulary under the BSD-3-Clause license. See THIRD_PARTY_NOTICES.txt.",
      "footer.tagline": "Ciyu · A little place for every small effort",
      "footer.data": "CET4 + CET6 · 6664 unique words · Data by KyleBing/english-vocabulary (BSD-3-Clause)",
      "toast.saveError": "Browser could not save your progress",
      "toast.noReview": "Nothing due for review right now",
      "toast.noStudy": "No words available for this word bank",
      "toast.sessionDone": "Set complete. Nice work",
      "toast.flipFirst": "Flip the card first, then choose",
      "toast.favorited": "Added to favorites",
      "toast.unfavorited": "Removed from favorites",
      "toast.noSpeech": "Speech is not supported in this browser",
      "toast.quizPool": "Not enough words for a quiz yet",
      "toast.noWrong": "No missed words this round. Learn something new",
      "toast.progressCleared": "Learning progress cleared",
      "toast.noFavorites": "No favorites yet",
      "toast.favoritesCleared": "Favorites cleared",
      "toast.settingsReset": "Default preferences restored",
      "toast.exported": "Progress exported",
      "toast.imported": "Progress imported",
      "toast.importError": "Import failed. Choose a valid progress file",
      "toast.modeSpell": "Switched to spelling",
      "toast.modeFlash": "Switched to flashcards",
      "toast.goalSet": "Daily goal set to {count} words",
      "toast.levelUpdated": "Default word bank updated",
      "toast.modeUpdated": "Default study mode updated",
      "toast.fontSize": "Text size updated",
      "toast.fontFamily": "Typeface updated",
      "toast.dataLoadError": "Could not load the word bank. Refresh the page",
      "confirm.clearProgress": "Clear all learning progress? Activity history will be removed. Favorites and settings stay.",
      "confirm.clearFavorites": "Clear all favorites? Learning progress will not be affected.",
      "confirm.resetSettings": "Reset preferences? Progress and favorites will not be affected.",
      "confirm.import": "Importing will overwrite current progress, favorites, and settings. Continue?",
      "confirm.titleProgress": "Clear learning progress?",
      "confirm.titleFavorites": "Clear favorites?",
      "confirm.titleSettings": "Reset preferences?",
      "confirm.titleImport": "Overwrite current data?",
      "confirm.metaProgress": "{learned} words seen · Favorites stay",
      "confirm.metaFavorites": "{count} saved words",
      "confirm.metaSettings": "Progress and favorites stay",
      "confirm.metaImport": "Current progress, favorites, and settings will be replaced",
      "confirm.importAction": "Import anyway"
    }
  };

  function t(key, variables = {}) {
    const table = UI_TEXT[state.language] || UI_TEXT.zh;
    const template = table[key] || UI_TEXT.zh[key] || key;
    return template.replace(/\{(\w+)\}/g, (match, name) => (
      Object.prototype.hasOwnProperty.call(variables, name) ? String(variables[name]) : match
    ));
  }

  const views = {
    dashboard: {
      title: () => t("title.dashboard", { greeting: getGreeting() }),
      doc: "今日"
    },
    learn: { title: () => t("title.learn"), doc: "学习" },
    library: { title: () => t("title.library"), doc: "词库" },
    quiz: { title: () => t("title.quiz"), doc: "测验" },
    stats: { title: () => t("title.stats"), doc: "进度" },
    settings: { title: () => t("title.settings"), doc: "设置" }
  };

  const defaultState = () => ({
    version: 1,
    dailyGoal: 20,
    theme: window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    language: "zh",
    favorites: [],
    progress: {},
    activity: {},
    settings: {
      level: "all",
      mode: "flash",
      fontSize: "normal",
      fontFamily: "default"
    }
  });

  let state = loadState();
  let currentView = "dashboard";
  let dailyWordId = null;
  let lastFocusedElement = null;
  let confirmResolver = null;
  let confirmReturnFocus = null;
  let confirmOriginalOverflow = "";

  let study = {
    deck: [],
    index: 0,
    mode: state.settings.mode || "flash",
    level: state.settings.level || "all",
    source: "daily",
    revealed: false,
    checked: false,
    spellCorrect: false,
    spellAnswer: "",
    know: 0,
    again: 0,
    done: false
  };

  let quiz = {
    active: false,
    done: false,
    questions: [],
    index: 0,
    score: 0,
    answered: false,
    selected: "",
    level: "all",
    wrongIds: [],
    masteredBefore: 0
  };

  let quizLevel = "all";
  let quizDirection = "en-zh";
  let toastTimer = null;
  let voice = null;

  const libraryFilters = {
    level: "all",
    status: "all",
    query: ""
  };
  let libraryVisible = 60;

  const gradeStatus = {
    know: "know",
    again: "again"
  };

  function loadState() {
    const fallback = defaultState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const saved = JSON.parse(raw);
      return {
        ...fallback,
        ...saved,
        language: saved.language === "en" ? "en" : "zh",
        favorites: Array.isArray(saved.favorites) ? saved.favorites.filter((id) => WORD_MAP.has(id)) : [],
        progress: saved.progress && typeof saved.progress === "object" ? saved.progress : {},
        activity: saved.activity && typeof saved.activity === "object" ? saved.activity : {},
        settings: {
          ...fallback.settings,
          ...(saved.settings || {}),
          level: String((saved.settings && saved.settings.level) || fallback.settings.level),
          fontSize: ["small", "normal", "large", "xlarge"].includes(saved.settings && saved.settings.fontSize)
            ? saved.settings.fontSize
            : fallback.settings.fontSize,
          fontFamily: ["default", "serif", "mono"].includes(saved.settings && saved.settings.fontFamily)
            ? saved.settings.fontFamily
            : fallback.settings.fontFamily
        }
      };
    } catch (error) {
      return fallback;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      showToast(t("toast.saveError"));
    }
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return map[char];
    });
  }

  function dayKey(timestamp = Date.now()) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function startOfDay(timestamp = Date.now()) {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  function shiftDay(timestamp, amount) {
    const date = new Date(timestamp);
    date.setDate(date.getDate() + amount);
    return date.getTime();
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (state.language === "en") {
      if (hour < 6) return "Still up";
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
    }
    if (hour < 6) return "夜深了";
    if (hour < 11) return "早上好";
    if (hour < 14) return "中午好";
    if (hour < 18) return "下午好";
    return "晚上好";
  }

  function getStreak() {
    let cursor = startOfDay();
    if (!state.activity[dayKey(cursor)]) {
      cursor = shiftDay(cursor, -1);
    }
    let streak = 0;
    while (state.activity[dayKey(cursor)] > 0 && streak < 3650) {
      streak += 1;
      cursor = shiftDay(cursor, -1);
    }
    return streak;
  }

  function countLearned() {
    return Object.keys(state.progress).filter((id) => WORD_MAP.has(id)).length;
  }

  function countMastered() {
    return Object.keys(state.progress).filter((id) => {
      const progress = state.progress[id];
      return WORD_MAP.has(id) && progress && progress.box >= 4;
    }).length;
  }

  function getAccuracy() {
    let correct = 0;
    let wrong = 0;
    Object.values(state.progress).forEach((progress) => {
      correct += Number(progress.correct) || 0;
      wrong += Number(progress.wrong) || 0;
    });
    return correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 0;
  }

  function isDue(progress) {
    return Boolean(progress && progress.due <= Date.now());
  }

  function matchesLevel(word, level) {
    if (!level || level === "all") return true;
    const numericLevel = Number(level);
    return Array.isArray(word.levels) ? word.levels.includes(numericLevel) : word.level === numericLevel;
  }

  function getLevelLabel(word) {
    return Array.isArray(word.levels) && word.levels.length > 1 ? "CET 4/6" : `CET ${word.level}`;
  }

  function levelTagMarkup(word) {
    return `<span class="level-tag level-${word.level}">${getLevelLabel(word)}</span>`;
  }

  function getDueWords(level = "all") {
    const pool = WORDS.filter((word) => matchesLevel(word, level));
    return pool.filter((word) => isDue(state.progress[word.id]));
  }

  function getNewWords(level = "all") {
    const pool = WORDS.filter((word) => matchesLevel(word, level));
    return pool.filter((word) => !state.progress[word.id]);
  }

  function getStatus(id) {
    const progress = state.progress[id];
    if (!progress) return { key: "new", label: t("status.new"), dot: "fresh" };
    if (progress.box >= 4) return { key: "mastered", label: t("status.mastered"), dot: "mastered" };
    return { key: "learning", label: t("status.learning"), dot: "learning" };
  }

  function addActivity() {
    const key = dayKey();
    state.activity[key] = (state.activity[key] || 0) + 1;
  }

  function gradeWord(id, grade) {
    const now = Date.now();
    const previous = state.progress[id] || {
      box: 0,
      due: now,
      correct: 0,
      wrong: 0,
      createdAt: now,
      lastAt: now
    };
    const next = { ...previous };
    if (grade === "know") {
      next.box = clamp((Number(previous.box) || 0) + 1, 1, 5);
      next.correct = (Number(previous.correct) || 0) + 1;
      next.due = startOfDay(now) + INTERVALS[next.box] * DAY;
    } else {
      next.box = 1;
      next.wrong = (Number(previous.wrong) || 0) + 1;
      next.due = now;
    }
    next.lastAt = now;
    next.createdAt = previous.createdAt || now;
    state.progress[id] = next;
    addActivity();
    saveState();
  }

  function buildDeck(level = "all", type = "daily", count = state.dailyGoal) {
    const pool = WORDS.filter((word) => matchesLevel(word, level));
    const due = shuffle(pool.filter((word) => isDue(state.progress[word.id])));
    const fresh = shuffle(pool.filter((word) => !state.progress[word.id]));

    if (type === "review") {
      return due.slice(0, count);
    }

    const deck = [];
    const dueTarget = Math.min(Math.ceil(count * 0.45), due.length);
    deck.push(...due.slice(0, dueTarget));
    deck.push(...fresh.slice(0, count - deck.length));

    if (deck.length < count) {
      const selectedIds = new Set(deck.map((word) => word.id));
      const future = shuffle(pool.filter((word) => {
        const progress = state.progress[word.id];
        return progress && !selectedIds.has(word.id) && !isDue(progress);
      }));
      deck.push(...future.slice(0, count - deck.length));
    }

    return deck;
  }

  function startStudy(options = {}) {
    const level = String(options.level || state.settings.level || "all");
    const mode = options.mode || state.settings.mode || "flash";
    const type = options.type || "daily";
    const deck = options.deck ? options.deck.slice() : buildDeck(level, type, options.count || state.dailyGoal);

    if (!deck.length) {
      if (type === "review") {
        showToast(t("toast.noReview"));
      } else {
        showToast(t("toast.noStudy"));
      }
      return;
    }

    state.settings.level = level;
    state.settings.mode = mode;
    saveState();

    study = {
      deck,
      index: 0,
      mode,
      level,
      source: options.source || (type === "review" ? "review" : "daily"),
      revealed: false,
      checked: false,
      spellCorrect: false,
      spellAnswer: "",
      know: 0,
      again: 0,
      done: false
    };

    syncStudyControls();
    switchView("learn");
    renderStudy();
  }

  function startDailyStudy() {
    if (study.deck.length && !study.done && study.source !== "single") {
      switchView("learn");
      return;
    }
    startStudy({ type: "daily", source: "daily" });
  }

  function ensureStudySession() {
    if (!study.deck.length) {
      const deck = buildDeck(study.level, "daily", state.dailyGoal);
      if (deck.length) {
        study = {
          ...study,
          deck,
          index: 0,
          source: "daily",
          revealed: false,
          checked: false,
          know: 0,
          again: 0,
          done: false
        };
      }
    }
    renderStudy();
  }

  function studyActionbarMarkup() {
    if (study.mode !== "flash") return "";
    if (!study.revealed) {
      return `
        <div class="study-actionbar">
          <button class="button button-dark reveal-button" type="button" data-action="reveal">
            ${t("study.showAnswer")} <svg><use href="#i-arrow"></use></svg>
          </button>
        </div>
      `;
    }
    return `
      <div class="study-actionbar">
        <button class="grade-button grade-again" type="button" data-grade="again">
          <svg><use href="#i-rotate"></use></svg> ${t("study.again")} <small>1</small>
        </button>
        <button class="grade-button grade-know" type="button" data-grade="know">
          <svg><use href="#i-check"></use></svg> ${t("study.know")} <small>2</small>
        </button>
      </div>
    `;
  }

  function renderStudy() {
    const stage = $("#studyStage");
    const deckLength = study.deck.length;
    const completed = study.done ? deckLength : study.index;
    const position = study.done ? deckLength : Math.min(study.index + 1, deckLength);

    $("#studyProgressText").textContent = `${position} / ${deckLength}`;
    $("#studyProgressBar").style.width = `${deckLength ? (completed / deckLength) * 100 : 0}%`;
    $("#sessionKnow").textContent = study.know;
    $("#sessionAgain").textContent = study.again;
    $("#studySessionLabel").textContent = study.source === "review" ? t("study.review") : t("study.today");

    if (!deckLength) {
      stage.innerHTML = "";
      return;
    }

    if (study.done) {
      const accuracy = study.know + study.again ? Math.round((study.know / (study.know + study.again)) * 100) : 0;
      stage.innerHTML = `
        <div class="study-finished">
          <span class="finished-mark"><svg><use href="#i-check"></use></svg></span>
          <h2>${t("study.finished", { count: deckLength })}</h2>
          <p>${t("study.finishedCopy", { know: study.know, again: study.again })}</p>
          <div class="finished-stats">
            <div><strong>${accuracy}%</strong><span>${t("study.accuracy")}</span></div>
            <div><strong>${study.know}</strong><span>${t("study.known")}</span></div>
            <div><strong>${study.again}</strong><span>${t("study.toRevisit")}</span></div>
          </div>
          <div class="finished-actions">
            <button class="button button-dark" type="button" data-action="new-session">${t("study.oneMore")}</button>
            <button class="button button-ghost" type="button" data-view-link="quiz">${t("study.goQuiz")}</button>
            <button class="button button-ghost" type="button" data-view-link="dashboard">${t("study.backToday")}</button>
          </div>
        </div>
      `;
      $("#studyShortcuts").style.display = "none";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    $("#studyShortcuts").style.display = "";
    const word = study.deck[study.index];
    const status = getStatus(word.id);
    const cardIndex = `${String(study.index + 1).padStart(2, "0")} / ${String(deckLength).padStart(2, "0")}`;

    if (study.mode === "spell") {
      renderSpellCard(stage, word, status, cardIndex);
      return;
    }

    const flipped = study.revealed ? " is-flipped" : "";
    stage.innerHTML = `
      <div class="flashcard${flipped}" id="flashcard" role="button" tabindex="0" aria-pressed="${study.revealed}" aria-label="点击翻面查看释义">
        <div class="flashcard-inner">
          <div class="flashcard-face flashcard-front">
            <div class="card-topline">
              ${levelTagMarkup(word)}
              <span class="card-index">${cardIndex}</span>
            </div>
            <div class="word-core">
              <h2>${esc(word.word)}</h2>
              ${word.phonetic ? `<p class="phonetic">${esc(word.phonetic)}</p>` : ""}
              <button class="word-pronounce" type="button" data-speak="${esc(word.word)}">
                <svg><use href="#i-volume"></use></svg> ${t("study.listen")}
              </button>
            </div>
            <div class="card-tip"><kbd>Space</kbd> ${t("study.tapReveal")}</div>
          </div>
          <div class="flashcard-face flashcard-back">
            <div class="card-topline">
              ${levelTagMarkup(word)}
              <span class="card-index">MEANING</span>
            </div>
            <div class="back-meaning">
              <span class="pos-chip">${esc(word.pos)}</span>
              <h3>${esc(word.meaning)}</h3>
            </div>
            <div class="example-block${word.example ? "" : " example-empty"}">
              <p>${word.example ? esc(word.example) : t("study.emptyExample")}</p>
              <span>${word.example ? esc(word.translation) : t("study.emptyExampleCopy")}</span>
            </div>
            <div class="card-back-foot">
              <span>${status.label.toUpperCase()} · ${t("study.stage", { stage: state.progress[word.id] ? state.progress[word.id].box : 0 })}</span>
              <button class="sound-button" type="button" data-speak="${esc(word.word)}" aria-label="朗读单词">
                <svg><use href="#i-volume"></use></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      ${studyActionbarMarkup()}
    `;
  }

  function renderSpellCard(stage, word, status, cardIndex) {
    const hint = t("study.hint", {
      letter: word.word.charAt(0),
      count: word.word.replace(/[^a-z]/gi, "").length
    });
    const feedback = study.checked ? `
      <div class="spell-feedback ${study.spellCorrect ? "correct" : "incorrect"}">
        <div class="feedback-head">
          <svg><use href="#i-${study.spellCorrect ? "check" : "x"}"></use></svg>
          ${study.spellCorrect ? t("study.spellCorrect") : t("study.spellWrong")}
        </div>
        <div class="feedback-word">${esc(word.word)}</div>
        <p class="feedback-example">${word.example ? esc(word.example) : `${esc(word.pos)} ${esc(word.meaning)}`}</p>
        <div class="spell-next-row">
          <button class="button button-dark" type="button" data-action="next-spell">${t("study.next")} <svg><use href="#i-arrow"></use></svg></button>
        </div>
      </div>
    ` : `
      <form class="spell-form" id="spellForm" autocomplete="off">
        <input class="spell-input" name="answer" type="text" placeholder="${t("study.placeholder")}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${t("study.placeholder")}">
        <button class="button button-dark" type="submit">${t("study.check")}</button>
      </form>
      <button class="quiet-button" type="button" data-action="show-answer">${t("study.showMe")}</button>
    `;

    stage.innerHTML = `
      <div class="spell-card">
        <div class="card-topline">
          ${levelTagMarkup(word)}
          <span class="card-index">${cardIndex}</span>
        </div>
        <div class="spell-body">
          <span class="spell-kicker">${t("study.spellKicker")}</span>
          <div class="spell-clue">
            <span class="pos-chip">${esc(word.pos)}</span>
            <h3>${esc(word.meaning)}</h3>
            ${word.phonetic ? `<p class="phonetic">${esc(word.phonetic)}</p>` : ""}
            <p class="spell-hint">${esc(hint)} · ${status.label}</p>
          </div>
          ${feedback}
        </div>
      </div>
    `;

    if (!study.checked && window.matchMedia("(pointer: fine)").matches) {
      window.requestAnimationFrame(() => {
        const input = $("#spellForm input");
        if (input) input.focus();
      });
    }
  }

  function toggleReveal() {
    if (study.mode !== "flash" || !study.deck.length || study.done) return;
    study.revealed = !study.revealed;
    const card = $("#flashcard");
    if (card) {
      card.classList.toggle("is-flipped", study.revealed);
      card.setAttribute("aria-pressed", String(study.revealed));
    }
    const actionbar = $(".study-actionbar");
    if (actionbar) actionbar.outerHTML = studyActionbarMarkup();
  }

  function nextStudyCard() {
    study.index += 1;
    study.revealed = false;
    study.checked = false;
    study.spellCorrect = false;
    study.spellAnswer = "";
    if (study.index >= study.deck.length) {
      study.done = true;
      renderStudy();
      renderDashboard();
      renderStats();
      showToast(t("toast.sessionDone"));
      return;
    }
    renderStudy();
  }

  function handleGrade(grade) {
    if (study.mode !== "flash" || !study.deck.length || study.done) return;
    if (!study.revealed) {
      showToast(t("toast.flipFirst"));
      return;
    }
    const word = study.deck[study.index];
    gradeWord(word.id, grade);
    if (grade === gradeStatus.know) {
      study.know += 1;
    } else {
      study.again += 1;
    }
    renderDashboard();
    nextStudyCard();
  }

  function checkSpelling(answer) {
    if (study.mode !== "spell" || study.checked || study.done) return;
    const word = study.deck[study.index];
    const normalized = answer.trim().toLowerCase().replace(/\s+/g, " ");
    const correct = normalized === word.word.toLowerCase();
    study.checked = true;
    study.spellCorrect = correct;
    study.spellAnswer = answer.trim();
    gradeWord(word.id, correct ? "know" : "again");
    if (correct) {
      study.know += 1;
    } else {
      study.again += 1;
    }
    renderDashboard();
    renderStudy();
  }

  function revealSpelling() {
    if (study.mode !== "spell" || study.checked || study.done) return;
    const word = study.deck[study.index];
    study.checked = true;
    study.spellCorrect = false;
    study.spellAnswer = "";
    gradeWord(word.id, "again");
    study.again += 1;
    renderDashboard();
    renderStudy();
  }

  function renderDashboard() {
    const todayCount = state.activity[dayKey()] || 0;
    const goal = state.dailyGoal;
    const goalPercent = clamp(Math.round((todayCount / goal) * 100), 0, 100);
    const learned = countLearned();
    const mastered = countMastered();
    const streak = getStreak();
    const accuracy = getAccuracy();
    const dueCount = getDueWords().length;
    const newCount = getNewWords().length;

    $("#dashboardGoalRing").style.setProperty("--progress", goalPercent);
    $("#dashboardGoalValue").textContent = `${goalPercent}%`;
    $("#dashboardGoalCount").textContent = todayCount;
    $("#dashboardGoalTotal").textContent = goal;
    $("#sidebarGoalRing").style.setProperty("--progress", goalPercent);
    $("#sidebarGoalValue").textContent = `${goalPercent}%`;
    $("#sidebarGoalText").textContent = `${todayCount} / ${goal} ${t("unit.words")}`;
    $("#topStreak").textContent = streak;
    $("#statStreak").textContent = streak;
    $("#statLearned").textContent = learned;
    $("#statMastered").textContent = mastered;
    $("#masteredHint").textContent = t("dash.accuracy", { value: accuracy });
    $("#learnedHint").textContent = t("dash.totalWords", { count: TOTAL_WORDS });
    $("#streakHint").textContent = streak > 0 ? t("dash.keepGoing") : t("dash.startToday");
    $("#dailyGoalSelect").value = String(goal);

    if (todayCount === 0) {
      $("#goalMessage").textContent = t("dash.goalEmpty");
    } else if (todayCount < goal) {
      $("#goalMessage").textContent = t("dash.goalLeft", { count: goal - todayCount });
    } else {
      $("#goalMessage").textContent = t("dash.goalDone");
    }

    $("#newWordsHint").textContent = newCount > 0 ? t("plan.newHint", { count: newCount }) : t("plan.newDone");
    $("#reviewWordsHint").textContent = dueCount > 0 ? t("plan.reviewHint", { count: dueCount }) : t("plan.reviewDone");
    $("#planNew").classList.toggle("is-done", todayCount >= goal);
    $("#planReview").classList.toggle("is-done", dueCount === 0);

    const date = new Date();
    $("#dateLabel").textContent = new Intl.DateTimeFormat(state.language === "en" ? "en-US" : "zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long"
    }).format(date);
    $("#planDate").textContent = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()];

    renderDailyWord();
  }

  function renderDailyWord() {
    if (!WORDS.length) return;
    const dayNumber = Math.floor(startOfDay() / DAY);
    const index = ((dayNumber * 7) + 13) % WORDS.length;
    const word = WORDS[index];
    dailyWordId = word.id;
    $("#dailyWord").textContent = word.word;
    $("#dailyPhonetic").textContent = word.phonetic;
    $("#dailyMeaning").textContent = `${word.pos} ${word.meaning}`;
    $("#dailyLevel").textContent = getLevelLabel(word);
    $("#dailySpeak").dataset.speak = word.word;
  }

  function searchRank(word, query) {
    if (!query) return 0;
    const term = word.word.toLowerCase();
    if (term === query) return 0;
    if (term.startsWith(query)) return 1;
    if (term.includes(query)) return 2;
    if (word.meaning.toLowerCase().includes(query)) return 3;
    return 4;
  }

  function renderLibrary() {
    const query = libraryFilters.query.trim().toLowerCase();
    const candidates = WORDS.filter((word) => {
      if (!matchesLevel(word, libraryFilters.level)) return false;
      if (libraryFilters.status !== "all") {
        const status = getStatus(word.id);
        if (libraryFilters.status === "favorite") {
          if (!state.favorites.includes(word.id)) return false;
        } else if (libraryFilters.status === "wrong") {
          const progress = state.progress[word.id];
          if (!progress || !progress.wrong || progress.box >= 4) return false;
        } else if (status.key !== libraryFilters.status) {
          return false;
        }
      }
      return true;
    });

    let filtered = candidates;
    let matchLabel = "";
    if (query) {
      const wordMatches = candidates.filter((word) => word.word.toLowerCase().includes(query));
      const meaningMatches = candidates.filter((word) => `${word.pos} ${word.meaning}`.toLowerCase().includes(query));
      const exampleMatches = candidates.filter((word) => `${word.example} ${word.translation}`.toLowerCase().includes(query));
      if (wordMatches.length) {
        filtered = wordMatches;
        matchLabel = t("library.wordMatch");
      } else if (meaningMatches.length) {
        filtered = meaningMatches;
        matchLabel = t("library.meaningMatch");
      } else if (exampleMatches.length) {
        filtered = exampleMatches;
        matchLabel = t("library.exampleMatch");
      } else {
        filtered = [];
        matchLabel = t("library.noMatch");
      }
    }

    filtered = filtered.slice().sort((a, b) => {
      const rankDifference = searchRank(a, query) - searchRank(b, query);
      return rankDifference || a.word.localeCompare(b.word);
    });

    const visibleWords = filtered.slice(0, libraryVisible);
    $("#searchCount").textContent = query
      ? `${filtered.length} / ${TOTAL_WORDS} · ${matchLabel}`
      : `${filtered.length} / ${TOTAL_WORDS}`;
    $("#libraryEmpty").hidden = filtered.length > 0;
    $("#libraryGrid").innerHTML = visibleWords.map((word) => {
      const status = getStatus(word.id);
      const favorite = state.favorites.includes(word.id);
      return `
        <article class="word-card" role="button" tabindex="0" data-word="${word.id}" aria-label="查看 ${esc(word.word)} 的词卡">
          <div class="word-card-top">
            ${levelTagMarkup(word)}
            <button class="star-button${favorite ? " is-favorite" : ""}" type="button" data-fav="${word.id}" aria-label="${favorite ? "取消收藏" : "收藏"} ${esc(word.word)}">
              <svg><use href="#i-star"></use></svg>
            </button>
          </div>
          <h3>${esc(word.word)}</h3>
          ${word.phonetic ? `<p class="phonetic">${esc(word.phonetic)}</p>` : ""}
          <p class="word-card-meaning">${esc(word.pos)} ${esc(word.meaning)}</p>
          <div class="word-card-foot">
            <span class="word-status"><i class="dot ${status.dot}"></i>${status.label}</span>
            <svg><use href="#i-arrow"></use></svg>
          </div>
        </article>
      `;
    }).join("");
    const more = $("#libraryMore");
    more.hidden = filtered.length <= libraryVisible;
    $("#libraryMoreCount").textContent = filtered.length > libraryVisible
      ? t("library.moreLeft", { count: filtered.length - libraryVisible })
      : "";
    $("#resetLibraryFilters").hidden = libraryFilters.level === "all" && libraryFilters.status === "all" && !libraryFilters.query;
  }

  function toggleFavorite(id) {
    if (!WORD_MAP.has(id)) return;
    const index = state.favorites.indexOf(id);
    if (index >= 0) {
      state.favorites.splice(index, 1);
      showToast(t("toast.unfavorited"));
    } else {
      state.favorites.push(id);
      showToast(t("toast.favorited"));
    }
    saveState();
    renderLibrary();
  }

  function openWord(id) {
    const word = WORD_MAP.get(id);
    if (!word) return;
    const status = getStatus(id);
    const progress = state.progress[id];
    const favorite = state.favorites.includes(id);
    const nextReview = progress
      ? (progress.due <= Date.now()
        ? t("modal.dueNow")
        : new Intl.DateTimeFormat(state.language === "en" ? "en-US" : "zh-CN", { month: "short", day: "numeric" }).format(new Date(progress.due)))
      : t("modal.notStarted");

    $("#modalContent").innerHTML = `
      <div class="modal-top">
        <div>
          <h2 class="modal-word" id="modalWord">${esc(word.word)}</h2>
          <div class="modal-phonetic-row">
            ${word.phonetic ? `<span>${esc(word.phonetic)}</span>` : ""}
            <button class="sound-button" type="button" data-speak="${esc(word.word)}" aria-label="朗读单词">
              <svg><use href="#i-volume"></use></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="modal-tags">
        ${levelTagMarkup(word)}
        <span class="level-tag" style="--dot: var(--gold)">${status.label}</span>
      </div>
      <div class="modal-meaning">
        <span class="pos-chip">${esc(word.pos)}</span>
        <h3>${esc(word.meaning)}</h3>
      </div>
      <div class="modal-example${word.example ? "" : " example-empty"}">
        <p>${word.example ? esc(word.example) : "试着用它造一个句子。"}</p>
        <span>${word.example ? esc(word.translation) : "造句，是记住一个词最快的方式。"}</span>
      </div>
      ${word.phrases && word.phrases.length ? `
        <div class="modal-phrases">
          <span class="modal-section-label">${t("modal.phrases")}</span>
          <div class="phrase-list">
            ${word.phrases.map((item) => `
              <div class="phrase-item">
                <strong>${esc(item.phrase)}</strong>
                <span>${esc(item.translation)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
      <div class="modal-progress">
        <div class="modal-progress-copy">
          <span>${t("modal.stage", { stage: progress ? progress.box : 0 })}</span>
          <strong>${t("modal.nextReview", { value: nextReview })}</strong>
        </div>
        <span class="word-status"><i class="dot ${status.dot}"></i>${status.label}</span>
      </div>
      <div class="modal-actions">
        <button class="button button-dark" type="button" data-modal-learn="${word.id}">${t("modal.learn")} <svg><use href="#i-arrow"></use></svg></button>
        <button class="star-button${favorite ? " is-favorite" : ""}" type="button" data-modal-fav="${word.id}" aria-label="${favorite ? "取消收藏" : "收藏"}">
          <svg><use href="#i-star"></use></svg>
        </button>
      </div>
    `;

    lastFocusedElement = document.activeElement;
    $("#wordModal").hidden = false;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      const close = $(".modal-close");
      if (close) close.focus();
    });
  }

  function closeWord() {
    $("#wordModal").hidden = true;
    document.body.style.overflow = "";
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  function requestConfirmation(options = {}) {
    return new Promise((resolve) => {
      if (confirmResolver) settleConfirmation(false);
      confirmResolver = resolve;
      confirmReturnFocus = document.activeElement;
      confirmOriginalOverflow = document.body.style.overflow;
      $("#confirmTitle").textContent = options.title || "";
      $("#confirmCopy").textContent = options.message || "";
      const meta = $("#confirmMeta");
      meta.textContent = options.meta || "";
      meta.hidden = !options.meta;
      $("#confirmAccept").textContent = options.confirmLabel || t("common.continue");
      $("#confirmAccept").className = options.tone === "neutral"
        ? "button button-dark"
        : "button button-confirm-danger";
      $("#confirmIcon").classList.toggle("neutral", options.tone === "neutral");
      $("#confirmIconUse").setAttribute("href", options.icon || "#i-trash");
      $("#confirmDialog").hidden = false;
      document.body.style.overflow = "hidden";
      window.requestAnimationFrame(() => $("#confirmCancel").focus());
    });
  }

  function settleConfirmation(confirmed) {
    if (!confirmResolver) return;
    const resolve = confirmResolver;
    confirmResolver = null;
    $("#confirmDialog").hidden = true;
    document.body.style.overflow = confirmOriginalOverflow;
    confirmOriginalOverflow = "";
    const focusTarget = confirmReturnFocus;
    confirmReturnFocus = null;
    if (focusTarget && typeof focusTarget.focus === "function" && document.contains(focusTarget)) {
      focusTarget.focus();
    }
    resolve(confirmed);
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) {
      showToast(t("toast.noSpeech"));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    utterance.pitch = 1;
    if (!voice) {
      const voices = window.speechSynthesis.getVoices();
      voice = voices.find((item) => item.lang === "en-US") || voices.find((item) => item.lang.startsWith("en")) || null;
    }
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  function startQuiz() {
    const pool = WORDS.filter((word) => matchesLevel(word, quizLevel));
    if (pool.length < 4) {
      showToast(t("toast.quizPool"));
      return;
    }

    const questionCount = Math.min(10, pool.length);
    const questions = shuffle(pool).slice(0, questionCount).map((word) => {
      const isChineseToEnglish = quizDirection === "zh-en";
      const correct = isChineseToEnglish ? word.word : word.meaning;
      const usedOptions = new Set([correct.toLowerCase()]);
      const distractors = [];
      shuffle(pool).forEach((candidate) => {
        if (distractors.length >= 3) return;
        if (candidate.id === word.id) return;
        const option = isChineseToEnglish ? candidate.word : candidate.meaning;
        const key = option.toLowerCase();
        if (usedOptions.has(key)) return;
        usedOptions.add(key);
        distractors.push(option);
      });
      return {
        wordId: word.id,
        correct,
        options: shuffle([correct, ...distractors])
      };
    });

    quiz = {
      active: true,
      done: false,
      questions,
      index: 0,
      score: 0,
      answered: false,
      selected: "",
      level: quizLevel,
      direction: quizDirection,
      wrongIds: [],
      masteredBefore: countMastered()
    };

    $("#quizSetup").hidden = true;
    $("#quizResult").hidden = true;
    $("#quizPlay").hidden = false;
    renderQuizQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderQuizQuestion() {
    const question = quiz.questions[quiz.index];
    const word = WORD_MAP.get(question.wordId);
    const total = quiz.questions.length;
    const progress = quiz.answered ? quiz.index + 1 : quiz.index;
    const letters = ["A", "B", "C", "D"];
    const selectedIsCorrect = quiz.selected === question.correct;
    const isChineseToEnglish = quiz.direction === "zh-en";

    $("#quizProgressText").textContent = `${quiz.index + 1} / ${total}`;
    $("#quizProgressBar").style.width = `${(progress / total) * 100}%`;
    $("#quizScore").textContent = quiz.score;

    const choices = question.options.map((option, index) => {
      let className = "quiz-choice";
      if (quiz.answered) {
        if (option === question.correct) className += " is-correct";
        if (option === quiz.selected && option !== question.correct) className += " is-wrong";
      }
      return `
        <button class="${className}" type="button" data-choice="${index}" ${quiz.answered ? "disabled" : ""}>
          <span class="choice-letter">${letters[index]}</span>
          <span class="${isChineseToEnglish ? "choice-word" : ""}">${esc(option)}</span>
        </button>
      `;
    }).join("");

    const feedback = quiz.answered ? `
      <div class="quiz-feedback ${selectedIsCorrect ? "correct" : "wrong"}">
        <span class="feedback-icon"><svg><use href="#i-${selectedIsCorrect ? "check" : "x"}"></use></svg></span>
        <div class="quiz-feedback-copy">
          <strong>${selectedIsCorrect ? t("quiz.correct") : t("quiz.wrong")}</strong>
          <span>${selectedIsCorrect ? esc(word.example || t("quiz.correctFallback")) : t("quiz.correctAnswer", { answer: question.correct })}</span>
        </div>
        <button class="button button-dark" type="button" data-action="quiz-next">
          ${quiz.index === total - 1 ? t("quiz.seeResult") : t("quiz.next")} <svg><use href="#i-arrow"></use></svg>
        </button>
      </div>
    ` : "";

    $("#quizCard").innerHTML = `
      <div class="quiz-question-meta">
        ${levelTagMarkup(word)}
        <span>QUESTION ${String(quiz.index + 1).padStart(2, "0")}</span>
      </div>
      <div class="quiz-word-area${isChineseToEnglish ? " quiz-word-area-zh" : ""}">
        ${isChineseToEnglish ? `
          <div class="quiz-meaning-prompt">
            <span class="pos-chip">${esc(word.pos)}</span>
            <h2 class="quiz-meaning">${esc(word.meaning)}</h2>
          </div>
          <p class="quiz-prompt" style="margin-top:19px">${t("quiz.promptZhEn")}</p>
        ` : `
          <h2 class="quiz-word">${esc(word.word)}</h2>
          <div class="quiz-phonetic-row">
            ${word.phonetic ? `<span>${esc(word.phonetic)}</span>` : ""}
            <button class="sound-button" type="button" data-speak="${esc(word.word)}" aria-label="朗读单词">
              <svg><use href="#i-volume"></use></svg>
            </button>
          </div>
          <p class="quiz-prompt" style="margin-top:16px">${t("quiz.promptEnZh")}</p>
        `}
      </div>
      <div class="quiz-choices">${choices}</div>
      ${feedback}
    `;
  }

  function answerQuiz(index) {
    if (!quiz.active || quiz.done || quiz.answered) return;
    const question = quiz.questions[quiz.index];
    if (!question || !question.options[index]) return;
    const selected = question.options[index];
    const correct = selected === question.correct;
    quiz.answered = true;
    quiz.selected = selected;
    if (correct) {
      quiz.score += 1;
      gradeWord(question.wordId, "know");
    } else {
      quiz.wrongIds.push(question.wordId);
      gradeWord(question.wordId, "again");
    }
    renderDashboard();
    renderQuizQuestion();
  }

  function nextQuizQuestion() {
    if (!quiz.active || !quiz.answered) return;
    if (quiz.index >= quiz.questions.length - 1) {
      finishQuiz();
      return;
    }
    quiz.index += 1;
    quiz.answered = false;
    quiz.selected = "";
    renderQuizQuestion();
  }

  function finishQuiz() {
    quiz.done = true;
    quiz.active = false;
    const total = quiz.questions.length;
    const accuracy = total ? Math.round((quiz.score / total) * 100) : 0;
    const mastered = countMastered();
    const gained = Math.max(0, mastered - quiz.masteredBefore);

    $("#quizPlay").hidden = true;
    $("#quizSetup").hidden = true;
    $("#quizResult").hidden = false;
    quiz.result = { accuracy, gained, wrongCount: quiz.wrongIds.length };
    updateQuizResultView();
    renderStats();
    renderDashboard();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateQuizResultView() {
    if (!quiz.result) return;
    const { accuracy, gained, wrongCount } = quiz.result;
    $("#resultScore").textContent = quiz.score;
    $("#resultAccuracy").textContent = `${accuracy}%`;
    $("#resultMastered").textContent = `+${gained}`;
    $("#resultReview").textContent = wrongCount;
    $("#resultCopy").textContent = t("quiz.resultCopy", {
      score: quiz.score,
      note: wrongCount ? t("quiz.resultNoteWrong") : t("quiz.resultNoteClear")
    });

    if (accuracy >= 90) {
      $("#resultTitle").textContent = t("quiz.resultHigh");
    } else if (accuracy >= 70) {
      $("#resultTitle").textContent = t("quiz.resultMid");
    } else {
      $("#resultTitle").textContent = t("quiz.resultLow");
    }
  }

  function resetQuizView() {
    quiz.active = false;
    quiz.done = false;
    $("#quizPlay").hidden = true;
    $("#quizResult").hidden = true;
    $("#quizSetup").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reviewQuizWrong() {
    const words = quiz.wrongIds.map((id) => WORD_MAP.get(id)).filter(Boolean);
    if (!words.length) {
      showToast(t("toast.noWrong"));
      switchView("learn");
      return;
    }
    startStudy({ deck: shuffle(words), source: "review", level: "all" });
  }

  function renderStats() {
    const learned = countLearned();
    const mastered = countMastered();
    const learning = Math.max(0, learned - mastered);
    const untouched = Math.max(0, TOTAL_WORDS - learned);
    const accuracy = getAccuracy();
    const streak = getStreak();
    const masteredPercent = TOTAL_WORDS ? Math.round((mastered / TOTAL_WORDS) * 100) : 0;

    $("#statsLearned").textContent = learned;
    $("#statsTotal").textContent = `/ ${TOTAL_WORDS}`;
    $("#statsLearnedBar").style.width = `${TOTAL_WORDS ? (learned / TOTAL_WORDS) * 100 : 0}%`;
    $("#statsStreak").textContent = streak;
    $("#statsAccuracy").textContent = accuracy;
    $("#statsStreakCopy").textContent = streak > 0 ? t("stats.streakActive") : t("stats.noRecord");
    $("#statsAccuracyCopy").textContent = accuracy > 0 ? t("stats.accuracyActive") : t("stats.accuracyEmpty");
    $("#masteryRing").style.setProperty("--progress", masteredPercent);
    $("#masteryValue").textContent = `${masteredPercent}%`;
    $("#masteryTotal").textContent = `${masteredPercent}%`;
    $("#masteredCount").textContent = mastered;
    $("#learningCount").textContent = learning;
    $("#untouchedCount").textContent = untouched;
    renderWeekChart();
    renderHeatmap();
  }

  function renderSettings() {
    $("#settingsLearned").textContent = countLearned();
    $("#settingsMastered").textContent = countMastered();
    $("#settingsFavorites").textContent = state.favorites.length;
    $("#settingsAccuracy").textContent = `${getAccuracy()}%`;

    $$("[data-setting-theme]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.settingTheme === state.theme);
    });
    $$("[data-setting-goal]").forEach((button) => {
      button.classList.toggle("is-active", Number(button.dataset.settingGoal) === state.dailyGoal);
    });
    $$("[data-setting-level]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.settingLevel === state.settings.level);
    });
    $$("[data-setting-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.settingMode === state.settings.mode);
    });
    $$("[data-setting-font-size]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.settingFontSize === state.settings.fontSize);
    });
    $$("[data-setting-font-family]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.settingFontFamily === state.settings.fontFamily);
    });
    $$("[data-setting-language]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.settingLanguage === state.language);
    });
  }

  function renderWeekChart() {
    const chart = $("#weekChart");
    const labels = state.language === "en"
      ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      : ["日", "一", "二", "三", "四", "五", "六"];
    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const timestamp = shiftDay(startOfDay(), -offset);
      days.push({
        timestamp,
        count: state.activity[dayKey(timestamp)] || 0,
        isToday: offset === 0
      });
    }
    const max = Math.max(1, ...days.map((day) => day.count));
    const total = days.reduce((sum, day) => sum + day.count, 0);
    $("#weekTotal").textContent = total;
    chart.innerHTML = days.map((day) => {
      const date = new Date(day.timestamp);
      const height = day.count ? Math.max(7, Math.round((day.count / max) * 100)) : 2;
      return `
        <div class="bar-col${day.isToday ? " is-today" : ""}">
          <span class="bar-count">${day.count || ""}</span>
          <div class="bar-track"><i class="bar-value" style="height:${height}%"></i></div>
          <span class="bar-label">${state.language === "en" ? labels[date.getDay()] : `周${labels[date.getDay()]}`}</span>
        </div>
      `;
    }).join("");
  }

  function renderHeatmap() {
    const today = new Date(startOfDay());
    const mondayOffset = (today.getDay() + 6) % 7;
    const start = shiftDay(startOfDay(), -(mondayOffset + 28));
    const cells = [];
    let total = 0;

    for (let index = 0; index < 35; index += 1) {
      const timestamp = shiftDay(start, index);
      const date = new Date(timestamp);
      const future = timestamp > startOfDay();
      const count = future ? 0 : state.activity[dayKey(timestamp)] || 0;
      if (!future) total += count;
      let level = 0;
      if (count >= 20) level = 4;
      else if (count >= 10) level = 3;
      else if (count >= 5) level = 2;
      else if (count > 0) level = 1;
      cells.push(`
        <span class="heat-cell" data-level="${level}"${future ? " data-future=\"true\"" : ""} title="${date.getMonth() + 1}月${date.getDate()}日 · ${count} 词"${future ? " style=\"opacity:.25\"" : ""}></span>
      `);
    }

    $("#heatmap").innerHTML = cells.join("");
    const months = [];
    for (let week = 0; week < 5; week += 1) {
      const date = new Date(shiftDay(start, week * 7));
      months.push(state.language === "en" ? `${date.getMonth() + 1} /` : `${date.getMonth() + 1}月`);
    }
    $("#heatmapMonths").innerHTML = months.map((month) => `<span>${month}</span>`).join("");
    $("#heatmapSummary").textContent = t("stats.heatmapSummary", { count: total });
  }

  function syncStudyControls() {
    $$("[data-study-level]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.studyLevel === state.settings.level);
    });
    $$("[data-study-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.studyMode === state.settings.mode);
    });
  }

  function syncQuizControls() {
    $$("[data-quiz-level]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.quizLevel === quizLevel);
    });
    $$("[data-quiz-direction]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.quizDirection === quizDirection);
    });
  }

  function applyDisplaySettings() {
    const zoomMap = { small: 0.94, normal: 1, large: 1.08, xlarge: 1.16 };
    document.body.style.zoom = String(zoomMap[state.settings.fontSize] || 1);
    document.documentElement.dataset.fontFamily = state.settings.fontFamily || "default";
  }

  function applyLanguage() {
    document.documentElement.lang = state.language === "en" ? "en" : "zh-CN";
    document.documentElement.dataset.language = state.language;
    $$("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    $$("[data-i18n-placeholder]").forEach((element) => {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    });
    $$("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    });
    const themeText = $(".theme-row-text");
    if (themeText) {
      themeText.textContent = state.theme === "dark" ? t("theme.lightMode") : t("theme.darkMode");
    }
    clearTimeout(toastTimer);
    $("#toast").classList.remove("is-visible");
    $("#viewTitle").textContent = views[currentView].title();
    renderDashboard();
    renderLibrary();
    renderStats();
    renderSettings();
    if (currentView === "learn" && study.deck.length) renderStudy();
    if (currentView === "quiz" && quiz.active && !$("#quizPlay").hidden) renderQuizQuestion();
    if (currentView === "quiz" && quiz.done && !$("#quizResult").hidden) updateQuizResultView();
    document.title = `词屿 · ${views[currentView].doc} | CET 4/6`;
  }

  function setTheme(theme, persist = true) {
    state.theme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = state.theme;
    const isDark = state.theme === "dark";
    const label = isDark ? t("theme.lightMode") : t("theme.darkMode");
    $$("#themeToggle use, #mobileThemeToggle use").forEach((use) => {
      use.setAttribute("href", isDark ? "#i-sun" : "#i-moon");
    });
    const themeText = $(".theme-row-text");
    if (themeText) themeText.textContent = label;
    $("#themeToggle").setAttribute("aria-label", `切换${label}`);
    $("#mobileThemeToggle").setAttribute("aria-label", `切换${label}`);
    $$("[data-setting-theme]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.settingTheme === state.theme);
    });
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#0c1a15" : "#173f34");
    if (persist) saveState();
  }

  function switchView(name, options = {}) {
    const viewName = views[name] ? name : "dashboard";
    currentView = viewName;
    $$(".view").forEach((view) => view.classList.toggle("is-active", view.dataset.view === viewName));
    $$(".nav-item, .mobile-nav button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.viewLink === viewName);
    });
    $("#viewTitle").textContent = views[viewName].title();
    document.title = `词屿 · ${views[viewName].doc} | CET 4/6 单词记忆`;

    if (viewName === "dashboard") renderDashboard();
    if (viewName === "learn") ensureStudySession();
    if (viewName === "library") renderLibrary();
    if (viewName === "stats") renderStats();
    if (viewName === "settings") renderSettings();
    if (viewName === "quiz" && quiz.active && !$("#quizPlay").hidden) renderQuizQuestion();
    if (viewName === "quiz" && quiz.done && !$("#quizResult").hidden) updateQuizResultView();

    if (options.scroll !== false) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2400);
  }

  function resetRuntimeSessions() {
    study = {
      ...study,
      deck: [],
      index: 0,
      revealed: false,
      checked: false,
      know: 0,
      again: 0,
      done: false
    };
    quiz = {
      ...quiz,
      active: false,
      done: false,
      questions: [],
      wrongIds: []
    };
    $("#quizPlay").hidden = true;
    $("#quizResult").hidden = true;
    $("#quizSetup").hidden = false;
  }

  async function resetProgress() {
    const confirmed = await requestConfirmation({
      title: t("confirm.titleProgress"),
      message: t("confirm.clearProgress"),
      meta: t("confirm.metaProgress", { learned: countLearned() }),
      confirmLabel: t("settings.clearProgressBtn"),
      icon: "#i-trash",
      tone: "danger"
    });
    if (!confirmed) return;
    state.progress = {};
    state.activity = {};
    saveState();
    resetRuntimeSessions();
    renderDashboard();
    renderLibrary();
    renderStats();
    renderSettings();
    showToast(t("toast.progressCleared"));
  }

  async function clearFavorites() {
    if (!state.favorites.length) {
      showToast(t("toast.noFavorites"));
      return;
    }
    const confirmed = await requestConfirmation({
      title: t("confirm.titleFavorites"),
      message: t("confirm.clearFavorites"),
      meta: t("confirm.metaFavorites", { count: state.favorites.length }),
      confirmLabel: t("settings.clearFavoritesBtn"),
      icon: "#i-star",
      tone: "danger"
    });
    if (!confirmed) return;
    state.favorites = [];
    saveState();
    renderLibrary();
    renderSettings();
    showToast(t("toast.favoritesCleared"));
  }

  async function resetSettings() {
    const confirmed = await requestConfirmation({
      title: t("confirm.titleSettings"),
      message: t("confirm.resetSettings"),
      meta: t("confirm.metaSettings"),
      confirmLabel: t("settings.resetBtn"),
      icon: "#i-rotate",
      tone: "neutral"
    });
    if (!confirmed) return;
    const defaults = defaultState();
    state.theme = defaults.theme;
    state.language = defaults.language;
    state.dailyGoal = 20;
    state.settings = {
      level: "all",
      mode: "flash",
      fontSize: "normal",
      fontFamily: "default"
    };
    setTheme(state.theme, false);
    applyDisplaySettings();
    applyLanguage();
    saveState();
    syncStudyControls();
    renderDashboard();
    renderSettings();
    showToast(t("toast.settingsReset"));
  }

  function exportProgress() {
    const payload = {
      app: "词屿",
      version: 1,
      exportedAt: new Date().toISOString(),
      state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ciyu-progress-${dayKey()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast(t("toast.exported"));
  }

  function normalizeImportedState(raw) {
    const source = raw && raw.state && typeof raw.state === "object" ? raw.state : raw;
    if (!source || typeof source !== "object" || !source.progress || typeof source.progress !== "object" || !source.activity || typeof source.activity !== "object") {
      throw new Error("invalid import");
    }

    const progress = {};
    Object.entries(source.progress).forEach(([id, value]) => {
      if (!WORD_MAP.has(id) || !value || typeof value !== "object") return;
      const box = clamp(Math.round(Number(value.box) || 0), 0, 5);
      const due = Number(value.due);
      const correct = Math.max(0, Math.round(Number(value.correct) || 0));
      const wrong = Math.max(0, Math.round(Number(value.wrong) || 0));
      const createdAt = Number(value.createdAt);
      const lastAt = Number(value.lastAt);
      progress[id] = {
        box,
        due: Number.isFinite(due) ? due : Date.now(),
        correct,
        wrong,
        createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
        lastAt: Number.isFinite(lastAt) ? lastAt : Date.now()
      };
    });

    const activity = {};
    Object.entries(source.activity).forEach(([key, value]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
      const count = Math.max(0, Math.round(Number(value) || 0));
      if (count > 0) activity[key] = count;
    });

    const favorites = [...new Set(
      (Array.isArray(source.favorites) ? source.favorites : []).filter((id) => WORD_MAP.has(id))
    )];
    const goal = Number(source.dailyGoal);
    const settings = source.settings && typeof source.settings === "object" ? source.settings : {};

    return {
      version: 1,
      theme: source.theme === "dark" ? "dark" : "light",
      language: source.language === "en" ? "en" : "zh",
      dailyGoal: [10, 20, 30, 40].includes(goal) ? goal : 20,
      favorites,
      progress,
      activity,
      settings: {
        level: ["all", "4", "6"].includes(String(settings.level)) ? String(settings.level) : "all",
        mode: ["flash", "spell"].includes(settings.mode) ? settings.mode : "flash",
        fontSize: ["small", "normal", "large", "xlarge"].includes(settings.fontSize) ? settings.fontSize : "normal",
        fontFamily: ["default", "serif", "mono"].includes(settings.fontFamily) ? settings.fontFamily : "default"
      }
    };
  }

  async function importProgressFile(file) {
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("invalid import");
      const raw = JSON.parse(await file.text());
      const imported = normalizeImportedState(raw);
      if (Object.keys(state.progress).length || state.favorites.length) {
        const confirmed = await requestConfirmation({
          title: t("confirm.titleImport"),
          message: t("confirm.import"),
          meta: t("confirm.metaImport"),
          confirmLabel: t("confirm.importAction"),
          icon: "#i-upload",
          tone: "danger"
        });
        if (!confirmed) return;
      }
      state = imported;
      resetRuntimeSessions();
      setTheme(state.theme, false);
      applyDisplaySettings();
      saveState();
      syncStudyControls();
      applyLanguage();
      renderDashboard();
      renderLibrary();
      renderStats();
      renderSettings();
      showToast(t("toast.imported"));
    } catch (error) {
      showToast(t("toast.importError"));
    }
  }

  function clearLibraryFilters() {
    libraryFilters.level = "all";
    libraryFilters.status = "all";
    libraryFilters.query = "";
    libraryVisible = 60;
    $("#librarySearch").value = "";
    $$("[data-lib-level]").forEach((button) => button.classList.toggle("is-active", button.dataset.libLevel === "all"));
    $$("[data-lib-status]").forEach((button) => button.classList.toggle("is-active", button.dataset.libStatus === "all"));
    renderLibrary();
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const speakButton = event.target.closest("[data-speak]");
      if (speakButton) {
        event.preventDefault();
        speak(speakButton.dataset.speak);
        return;
      }

      const viewLink = event.target.closest("[data-view-link]");
      if (viewLink) {
        event.preventDefault();
        switchView(viewLink.dataset.viewLink);
        return;
      }

      const gradeButton = event.target.closest("[data-grade]");
      if (gradeButton) {
        handleGrade(gradeButton.dataset.grade);
        return;
      }

      const actionButton = event.target.closest("[data-action]");
      if (actionButton) {
        event.preventDefault();
        const action = actionButton.dataset.action;
        if (action === "start-daily") startDailyStudy();
        if (action === "start-review") startStudy({ type: "review", source: "review" });
        if (action === "new-session") startStudy({ type: "daily", source: "daily", level: study.level });
        if (action === "reveal") toggleReveal();
        if (action === "next-spell") nextStudyCard();
        if (action === "show-answer") revealSpelling();
        if (action === "quiz-next") nextQuizQuestion();
        if (action === "review-wrong") reviewQuizWrong();
        return;
      }

      const dailyWordButton = event.target.closest("#openDailyWord");
      if (dailyWordButton && dailyWordId) {
        openWord(dailyWordId);
      }
    });

    $("#studyStage").addEventListener("click", (event) => {
      if (event.target.closest("[data-speak]") || event.target.closest("button") || event.target.closest("form")) return;
      const card = event.target.closest(".flashcard");
      if (card) toggleReveal();
    });

    $("#studyStage").addEventListener("submit", (event) => {
      if (!event.target.matches("#spellForm")) return;
      event.preventDefault();
      const input = event.target.querySelector("input");
      checkSpelling(input ? input.value : "");
    });

    $("#libraryGrid").addEventListener("click", (event) => {
      const favoriteButton = event.target.closest("[data-fav]");
      if (favoriteButton) {
        event.stopPropagation();
        toggleFavorite(favoriteButton.dataset.fav);
        return;
      }
      const card = event.target.closest(".word-card");
      if (card) openWord(card.dataset.word);
    });

    $("#libraryGrid").addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest(".word-card");
      if (!card || event.target.closest("button")) return;
      event.preventDefault();
      openWord(card.dataset.word);
    });

    $("#librarySearch").addEventListener("input", (event) => {
      libraryFilters.query = event.target.value;
      libraryVisible = 60;
      renderLibrary();
    });

    $$("[data-lib-level]").forEach((button) => {
      button.addEventListener("click", () => {
        libraryFilters.level = button.dataset.libLevel;
        libraryVisible = 60;
        $$("[data-lib-level]").forEach((item) => item.classList.toggle("is-active", item === button));
        renderLibrary();
      });
    });

    $$("[data-lib-status]").forEach((button) => {
      button.addEventListener("click", () => {
        libraryFilters.status = button.dataset.libStatus;
        libraryVisible = 60;
        $$("[data-lib-status]").forEach((item) => item.classList.toggle("is-active", item === button));
        renderLibrary();
      });
    });

    $("#clearLibraryFilters").addEventListener("click", clearLibraryFilters);
    $("#resetLibraryFilters").addEventListener("click", clearLibraryFilters);
    $("#loadMoreWords").addEventListener("click", () => {
      libraryVisible += 60;
      renderLibrary();
    });

    $$("[data-study-level]").forEach((button) => {
      button.addEventListener("click", () => {
        const level = button.dataset.studyLevel;
        if (level === state.settings.level && study.deck.length && !study.done) return;
        startStudy({ level, type: "daily", source: "daily" });
      });
    });

    $$("[data-study-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.dataset.studyMode;
        if (mode === state.settings.mode && study.deck.length && !study.done) return;
        startStudy({ mode, type: "daily", source: "daily", level: state.settings.level });
        showToast(mode === "spell" ? t("toast.modeSpell") : t("toast.modeFlash"));
      });
    });

    $("#dailyGoalSelect").addEventListener("change", (event) => {
      state.dailyGoal = Number(event.target.value) || 20;
      saveState();
      renderDashboard();
      renderSettings();
      showToast(t("toast.goalSet", { count: state.dailyGoal }));
    });

    $$("[data-setting-goal]").forEach((button) => {
      button.addEventListener("click", () => {
        state.dailyGoal = Number(button.dataset.settingGoal) || 20;
        saveState();
        renderDashboard();
        renderSettings();
        showToast(t("toast.goalSet", { count: state.dailyGoal }));
      });
    });

    $$("[data-setting-level]").forEach((button) => {
      button.addEventListener("click", () => {
        state.settings.level = button.dataset.settingLevel;
        saveState();
        syncStudyControls();
        renderSettings();
        showToast(t("toast.levelUpdated"));
      });
    });

    $$("[data-setting-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        state.settings.mode = button.dataset.settingMode;
        saveState();
        syncStudyControls();
        renderSettings();
        showToast(t("toast.modeUpdated"));
      });
    });

    $$("[data-setting-font-size]").forEach((button) => {
      button.addEventListener("click", () => {
        state.settings.fontSize = button.dataset.settingFontSize;
        applyDisplaySettings();
        saveState();
        renderSettings();
        showToast(t("toast.fontSize"));
      });
    });

    $$("[data-setting-font-family]").forEach((button) => {
      button.addEventListener("click", () => {
        state.settings.fontFamily = button.dataset.settingFontFamily;
        applyDisplaySettings();
        saveState();
        renderSettings();
        showToast(t("toast.fontFamily"));
      });
    });

    $$("[data-setting-language]").forEach((button) => {
      button.addEventListener("click", () => {
        state.language = button.dataset.settingLanguage === "en" ? "en" : "zh";
        saveState();
        applyLanguage();
      });
    });

    $$("[data-setting-theme]").forEach((button) => {
      button.addEventListener("click", () => {
        setTheme(button.dataset.settingTheme);
        renderSettings();
      });
    });

    $("#exportProgress").addEventListener("click", exportProgress);
    $("#importProgress").addEventListener("click", () => $("#importFile").click());
    $("#importFile").addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      event.target.value = "";
      await importProgressFile(file);
    });
    $("#clearFavorites").addEventListener("click", clearFavorites);
    $("#resetSettings").addEventListener("click", resetSettings);

    $("#themeToggle").addEventListener("click", () => setTheme(state.theme === "dark" ? "light" : "dark"));
    $("#mobileThemeToggle").addEventListener("click", () => setTheme(state.theme === "dark" ? "light" : "dark"));
    $("#quickStudy").addEventListener("click", startDailyStudy);

    $("#wordModal").addEventListener("click", (event) => {
      if (event.target === $("#wordModal")) closeWord();
      const favoriteButton = event.target.closest("[data-modal-fav]");
      if (favoriteButton) {
        toggleFavorite(favoriteButton.dataset.modalFav);
        openWord(favoriteButton.dataset.modalFav);
        return;
      }
      const learnButton = event.target.closest("[data-modal-learn]");
      if (learnButton) {
        const word = WORD_MAP.get(learnButton.dataset.modalLearn);
        closeWord();
        if (word) startStudy({ deck: [word], source: "single", level: word.level });
      }
    });

    $(".modal-close").addEventListener("click", closeWord);

    $("#confirmCancel").addEventListener("click", () => settleConfirmation(false));
    $("#confirmAccept").addEventListener("click", () => settleConfirmation(true));
    $("#confirmDialog").addEventListener("click", (event) => {
      if (event.target === $("#confirmDialog")) settleConfirmation(false);
    });


    $$("[data-quiz-level]").forEach((button) => {
      button.addEventListener("click", () => {
        quizLevel = button.dataset.quizLevel;
        syncQuizControls();
      });
    });

    $$("[data-quiz-direction]").forEach((button) => {
      button.addEventListener("click", () => {
        quizDirection = button.dataset.quizDirection;
        syncQuizControls();
      });
    });

    $("#startQuiz").addEventListener("click", startQuiz);
    $("#quitQuiz").addEventListener("click", resetQuizView);
    $("#restartQuiz").addEventListener("click", startQuiz);
    $("#resetProgress").addEventListener("click", resetProgress);

    $("#quizCard").addEventListener("click", (event) => {
      const choice = event.target.closest("[data-choice]");
      if (choice) answerQuiz(Number(choice.dataset.choice));
    });

    document.addEventListener("keydown", (event) => {
      if (!$("#confirmDialog").hidden) {
        if (event.key === "Escape") {
          event.preventDefault();
          settleConfirmation(false);
          return;
        }
        if (event.key === "Tab") {
          const focusable = [$("#confirmCancel"), $("#confirmAccept")];
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
        return;
      }

      if (!$("#wordModal").hidden) {
        if (event.key === "Escape") closeWord();
        return;
      }

      const isField = event.target.closest("input, textarea, select, [contenteditable='true']");
      if (isField) return;
      const onButton = event.target.closest("button, a");
      if (onButton && (event.key === "Enter" || event.code === "Space")) return;

      if (currentView === "learn" && study.deck.length && !study.done) {
        if (study.mode === "flash") {
          if (event.code === "Space" || event.key === "Enter") {
            event.preventDefault();
            toggleReveal();
          }
          if (event.key === "1" && study.revealed) {
            event.preventDefault();
            handleGrade("again");
          }
          if (event.key === "2" && study.revealed) {
            event.preventDefault();
            handleGrade("know");
          }
        }
      }

      if (currentView === "quiz" && !$("#quizPlay").hidden) {
        if (["1", "2", "3", "4"].includes(event.key) && !quiz.answered) {
          event.preventDefault();
          answerQuiz(Number(event.key) - 1);
        }
        if (event.key === "Enter" && quiz.answered) {
          event.preventDefault();
          nextQuizQuestion();
        }
      }

      if (event.key === "Escape" && currentView === "quiz" && !$("#quizPlay").hidden) {
        resetQuizView();
      }
    });

    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY) return;
      state = loadState();
      setTheme(state.theme, false);
      renderDashboard();
      renderLibrary();
      renderStats();
    });

    if ("speechSynthesis" in window) {
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        const voices = window.speechSynthesis.getVoices();
        voice = voices.find((item) => item.lang === "en-US") || voices.find((item) => item.lang.startsWith("en")) || null;
      });
    }
  }

  function init() {
    if (!WORDS.length) {
      showToast(t("toast.dataLoadError"));
      return;
    }
    setTheme(state.theme, false);
    applyDisplaySettings();
    applyLanguage();
    syncStudyControls();
    syncQuizControls();
    bindEvents();
    renderDashboard();
    renderLibrary();
    renderStats();
    renderSettings();
    switchView("dashboard", { scroll: false });
  }

  init();
})();
