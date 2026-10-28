// 기본 맛집 목록. 앱에서 수정한 내용은 브라우저(localStorage)에 따로 저장된다.
// cat: 한식 | 고기 | 일식 | 돈까스 | 양식 | 아시안 | 중식 | 기타
// tags: lunch(점심), dinner(회식)
// visited: false 면 '안가본곳'
const DEFAULT_RESTAURANTS = [
  { name: "조이푸드", cat: "한식", tags: ["lunch"], visited: true },
  { name: "한식뷔페 지하", cat: "한식", tags: ["lunch"], visited: true },
  { name: "갈냉", cat: "한식", tags: ["lunch"], visited: true },
  { name: "도도한면", cat: "일식", tags: ["lunch"], visited: true, memo: "우동" },
  { name: "장가", cat: "기타", tags: ["lunch"], visited: true },
  { name: "무공돈까스", cat: "돈까스", tags: ["lunch"], visited: true },
  { name: "담소", cat: "한식", tags: ["lunch"], visited: true },
  { name: "길동우동", cat: "일식", tags: ["lunch"], visited: true },
  { name: "페레힐", cat: "기타", tags: ["lunch"], visited: true },
  { name: "도담순대국", cat: "한식", tags: ["lunch"], visited: true },
  { name: "성수곰식당", cat: "한식", tags: ["lunch"], visited: true },
  { name: "고깃바", cat: "고기", tags: ["dinner"], visited: true },
  { name: "멘야마쯔리", cat: "일식", tags: ["lunch"], visited: true, memo: "라멘" },
  { name: "더블해피니스", cat: "기타", tags: ["lunch"], visited: true },
  { name: "쉑쉑버거", cat: "양식", tags: ["lunch"], visited: true },
  { name: "진국당", cat: "한식", tags: ["lunch"], visited: true },
  { name: "오레노카츠", cat: "돈까스", tags: ["lunch"], visited: true },
  { name: "솥뚜껑", cat: "고기", tags: ["dinner"], visited: true },
  { name: "맛있소 부대찌개", cat: "한식", tags: ["lunch"], visited: true },
  { name: "왕돈까스", cat: "돈까스", tags: ["lunch"], visited: true },
  { name: "핵밥", cat: "일식", tags: ["lunch"], visited: true },
  { name: "솔솥", cat: "한식", tags: ["lunch"], visited: true, memo: "솥밥" },
  { name: "마하차이", cat: "아시안", tags: ["lunch"], visited: true },
  { name: "미키스시", cat: "일식", tags: ["lunch"], visited: true },
  { name: "사토규카츠", cat: "돈까스", tags: ["lunch"], visited: true },
  { name: "빅쭌부대찌개", cat: "한식", tags: ["lunch"], visited: true },
  { name: "마초스테이크", cat: "양식", tags: ["lunch"], visited: true },
  { name: "마블정", cat: "고기", tags: ["dinner"], visited: true },
  { name: "미루성수", cat: "기타", tags: ["lunch"], visited: true },
  { name: "스케줄", cat: "양식", tags: ["lunch"], visited: true },
  { name: "무화화", cat: "기타", tags: ["lunch"], visited: true },
  { name: "달맞이광장바베큐", cat: "고기", tags: ["dinner"], visited: true },
  { name: "샤브인서울", cat: "기타", tags: ["lunch", "dinner"], visited: true, memo: "샤브샤브" },
  { name: "포유", cat: "아시안", tags: ["lunch"], visited: true },
  { name: "우향가", cat: "고기", tags: ["dinner"], visited: true },
  { name: "카리스", cat: "기타", tags: ["lunch"], visited: true },
  { name: "화화돈", cat: "고기", tags: ["dinner"], visited: true },

  // 안가본곳
  { name: "하루나", cat: "일식", tags: ["lunch"], visited: false },
  { name: "탐광", cat: "기타", tags: ["lunch"], visited: false },
  { name: "죠죠 성수", cat: "기타", tags: ["lunch"], visited: false },
  { name: "석암생석쇠구이", cat: "고기", tags: ["dinner"], visited: false },
  { name: "이가네양꼬치", cat: "중식", tags: ["dinner"], visited: false },
  { name: "까사아지오", cat: "양식", tags: ["lunch"], visited: false },
  { name: "피터팬돈까스", cat: "돈까스", tags: ["lunch"], visited: false },
  { name: "메가덕스", cat: "기타", tags: ["lunch"], visited: false },
  { name: "가가호호", cat: "기타", tags: ["lunch"], visited: false },
  { name: "현방오백소갈비살", cat: "고기", tags: ["dinner"], visited: false },
];

const CATEGORIES = ["한식", "고기", "일식", "돈까스", "양식", "아시안", "중식", "기타"];
const CAT_EMOJI = {
  한식: "🍚", 고기: "🥩", 일식: "🍣", 돈까스: "🍖",
  양식: "🍔", 아시안: "🍜", 중식: "🥟", 기타: "🍽️",
};
