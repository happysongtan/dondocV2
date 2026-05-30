const CHARACTER_STAGES = [
  {
    stage: 5,
    name: '집사',
    image: new URL('../assets/characters/step1_Butler.png', import.meta.url).href,
    effect: 'good',
    message: '완벽하게 절약 중이에요! 돼지가 행복해해요.',
  },
  {
    stage: 4,
    name: '농부',
    image: new URL('../assets/characters/step2_farmer.png', import.meta.url).href,
    effect: 'good',
    message: '잘 관리하고 있어요! 돼지가 건강해요.',
  },
  {
    stage: 3,
    name: '평민',
    image: new URL('../assets/characters/step3_common.png', import.meta.url).href,
    effect: 'neutral',
    message: '무난하게 쓰고 있어요. 조금만 더 아껴봐요.',
  },
  {
    stage: 2,
    name: '도둑',
    image: new URL('../assets/characters/Step4_theif.png', import.meta.url).href,
    effect: 'bad',
    message: '과소비 위험! 지출 속도를 줄여야 해요.',
  },
  {
    stage: 1,
    name: '도축사',
    image: new URL('../assets/characters/step5_pig_Slaughter.png', import.meta.url).href,
    effect: 'bad',
    message: '돼지가 위험해요! 지금 당장 지출을 멈춰요.',
  },
];

const PIG_LEVELS = [
  {
    level: 10,
    emoji: 'pig',
    face: 'face_good',
    label: '완벽한 재정 관리',
    color: '#FFD700',
    bgColor: '#FFFDE7',
    borderColor: '#FFD700',
    message: '완벽해요! 황금 돼지가 되었어요! 오늘도 훌륭한 절약이에요.',
  },
  {
    level: 9,
    emoji: 'pig',
    face: 'face_good',
    label: '우수한 상태',
    color: '#66BB6A',
    bgColor: '#E8F5E9',
    borderColor: '#66BB6A',
    message: '아주 잘하고 있어요! 돼지가 건강하게 빛나고 있어요.',
  },
  {
    level: 8,
    emoji: 'pig',
    face: 'face_good',
    label: '좋은 상태',
    color: '#26A69A',
    bgColor: '#E0F2F1',
    borderColor: '#26A69A',
    message: '좋아요! 목표에 거의 다 왔어요.',
  },
  {
    level: 7,
    emoji: 'pig',
    face: 'face_warn',
    label: '평범한 상태',
    color: '#78909C',
    bgColor: '#ECEFF1',
    borderColor: '#78909C',
    message: '평범한 상태예요. 조금만 더 아끼면 좋겠어요.',
  },
  {
    level: 6,
    emoji: 'pig',
    face: 'face_warn',
    label: '주의 필요',
    color: '#FFA726',
    bgColor: '#FFF3E0',
    borderColor: '#FFA726',
    message: '주의가 필요해요! 지출이 목표를 넘었어요.',
  },
  {
    level: 5,
    emoji: 'pig',
    face: 'face_warn',
    label: '경고',
    color: '#FF7043',
    bgColor: '#FBE9E7',
    borderColor: '#FF7043',
    message: '경고! 지출이 많이 늘었어요. 돼지가 힘들어해요.',
  },
  {
    level: 4,
    emoji: 'pig',
    face: 'face_bad',
    label: '위험',
    color: '#EF5350',
    bgColor: '#FFEBEE',
    borderColor: '#EF5350',
    message: '위험해요! 오늘 지출을 줄여야 해요.',
  },
  {
    level: 3,
    emoji: 'pig',
    face: 'face_bad',
    label: '심각',
    color: '#E53935',
    bgColor: '#FFCDD2',
    borderColor: '#E53935',
    message: '심각해요! 돼지가 아파요. 지금 당장 지출을 멈춰요.',
  },
  {
    level: 2,
    emoji: 'pig',
    face: 'face_bad',
    label: '매우 위험',
    color: '#B71C1C',
    bgColor: '#FFCDD2',
    borderColor: '#B71C1C',
    message: '매우 위험! 돼지가 쓰러지기 직전이에요.',
  },
  {
    level: 1,
    emoji: 'pig',
    face: 'skull',
    label: '위기 상황',
    color: '#212121',
    bgColor: '#F5F5F5',
    borderColor: '#212121',
    message: '위기 상황! 돼지가 위험에 처했어요. 소비를 즉시 중단해요.',
  },
];

const HOUSE_LEVELS = [
  { level: 1, name: '흙바닥', emoji: 'house_rock', description: '아직 집이 없어요...' },
  { level: 2, name: '오두막', emoji: 'house_hut', description: '작은 오두막이 생겼어요!' },
  { level: 3, name: '집', emoji: 'house_home', description: '편안한 집이 생겼어요!' },
  { level: 4, name: '빌라', emoji: 'house_villa', description: '멋진 빌라로 이사했어요!' },
  { level: 5, name: '대저택', emoji: 'house_castle', description: '꿈의 대저택에 살고 있어요!' },
];

const PIG_MESSAGES = {
  10: '꿀꿀~ 나 요즘 너무 행복해!\n밥도 많이 먹고 살도 찌고\n이게 바로 황금 돼지야!',
  9: '꿀꿀! 오늘도 든든해~\n이 기세라면 곧 황금이 될 거야!',
  8: '음냐~ 배불러.\n요즘 잘 먹고 잘 살고 있어!',
  7: '꿀꿀... 평범하게 살고 있어.\n그냥 그런 하루야.',
  6: '흠... 요즘 좀 걱정돼.\n밥은 먹고 있는데 뭔가 불안해.',
  5: '꿀꿀... 배가 좀 고픈 것 같기도 하고.\n지갑이 얇아지는 느낌이야...',
  4: '으으... 요즘 힘들어.\n밥을 줄여야 하나 봐.',
  3: '꿀꿀... 갈비뼈가 보여.\n나 지금 많이 힘들거든?',
  2: '살려줘... 너무 배고파.\n이러다가 진짜 쓰러질 것 같아...',
  1: '...\n나... 이제 삼겹살이 되는 건가.',
};

export function usePigSystem() {
  function getPigStateByLevel(level) {
    return PIG_LEVELS.find((p) => p.level === level) || PIG_LEVELS[6];
  }

  function getHouseInfo(level) {
    return HOUSE_LEVELS.find((h) => h.level === level) || HOUSE_LEVELS[0];
  }

  function getCharacterByLevel(level) {
    return CHARACTER_STAGES.find((c) => c.stage === level) || CHARACTER_STAGES[2];
  }

  function getPigMessage(level) {
    return PIG_MESSAGES[level] ?? PIG_MESSAGES[5];
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  }

  function formatDate(dateStr) {
    const [, month, day] = dateStr.split('-');
    return `${parseInt(month)}월 ${parseInt(day)}일`;
  }

  function getCharacterGuideMessage(character, monthlyExpense, dailyBudget, currentMonth) {
    if (!dailyBudget || dailyBudget <= 0) return '예산을 설정하면\n가이드를 드릴게요!';
    if (!character) return '데이터가 없어요.';

    const [year, month] = currentMonth.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate();
    const today = new Date();
    const remainDays = totalDays - today.getDate();
    const monthlyBudget = dailyBudget * totalDays;
    const remainBudget = monthlyBudget - monthlyExpense;
    const recommendPerDay = remainDays > 0 ? Math.floor(remainBudget / remainDays) : 0;

    const fmt = (n) => new Intl.NumberFormat('ko-KR').format(n);

    const stageGuides = {
      good: `지금 페이스면 이번 달\n예산 안에서 끝낼 수 있어요!`,
      neutral: `조금만 더 아끼면\n다음 달 집이 업그레이드돼요.`,
      bad: `지출 속도가 너무 빨라요!\n하루 ${fmt(Math.max(recommendPerDay, 0))}원 이하로 줄여야 해요.`,
    };

    return `${character.name}\n\n${stageGuides[character.effect]}`;
  }

  function getPigState(expense, dailyBudget) {
    if (!dailyBudget || dailyBudget <= 0) return getPigStateByLevel(7);
    const ratio = expense / dailyBudget;
    let level = 1;
    if (ratio <= 0.1) level = 10;
    else if (ratio <= 0.3) level = 9;
    else if (ratio <= 0.6) level = 8;
    else if (ratio <= 1.0) level = 7;
    else if (ratio <= 1.3) level = 6;
    else if (ratio <= 1.6) level = 5;
    else if (ratio <= 2.0) level = 4;
    else if (ratio <= 3.0) level = 3;
    else if (ratio <= 5.0) level = 2;
    else level = 1;

    return getPigStateByLevel(level);
  }

  return {
    PIG_LEVELS,
    HOUSE_LEVELS,
    CHARACTER_STAGES,
    getPigState,
    getPigStateByLevel,
    getHouseInfo,
    getCharacterByLevel,
    getPigMessage,
    formatCurrency,
    formatDate,
    getCharacterGuideMessage,
  };
}
