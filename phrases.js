// 練習フレーズ集 — レベル別 / カテゴリ別
// hint には日本語話者がつまずきやすいポイントを記載
window.PHRASES = {
  beginner: [
    {
      en: "I have a pen.",
      ja: "私はペンを持っています。",
      hint: "have の /h/ をしっかり息で発音し、pen の /p/ は破裂させて。",
    },
    {
      en: "Where are you from?",
      ja: "どちらのご出身ですか？",
      hint: "where の /w/ は唇を丸めて。are you はリンクして「アーユ」のように。",
    },
    {
      en: "How was your day?",
      ja: "今日はどうだった？",
      hint: "How /haʊ/ の二重母音を意識。your は弱く「ヤ」程度に。",
    },
    {
      en: "Thank you very much.",
      ja: "本当にありがとう。",
      hint: "Thank の /θ/ は上前歯と舌先で息を出す音。「サンク」ではない。",
    },
    {
      en: "Could you say that again?",
      ja: "もう一度言ってもらえますか？",
      hint: "Could you は「クッヂュ」のように繋がる。that の /ð/ も意識。",
    },
    {
      en: "I would like some water.",
      ja: "水をいただきたいです。",
      hint: "would like → 「ウッライク」と繋げる。water の /t/ は弱く「ワーラー」に近く。",
    },
  ],
  intermediate: [
    {
      en: "I really need to read this article carefully.",
      ja: "この記事を本当によく読まないといけない。",
      hint: "really, read の /r/ と article の /l/ をはっきり区別。舌の位置に注意。",
    },
    {
      en: "She thought that the third theme was the best.",
      ja: "彼女は3番目のテーマが最も良いと考えた。",
      hint: "thought, third, theme は全部 /θ/。舌先を歯につけて息のみで発音。",
    },
    {
      en: "Have you ever been to Vancouver in November?",
      ja: "11月にバンクーバーに行ったことはありますか？",
      hint: "Vancouver, November の /v/ は下唇を噛む。/b/ と混ぜないこと。",
    },
    {
      en: "Could you tell me the difference between these two options?",
      ja: "この2つの違いを教えていただけますか？",
      hint: "Could you tell me がリンクして「クッヂュテミ」のように。",
    },
    {
      en: "The weather forecast for tomorrow looks pretty bad.",
      ja: "明日の天気予報はかなり悪そうだ。",
      hint: "weather の /ð/、forecast の強勢は前。pretty の /t/ はフラップ気味に。",
    },
    {
      en: "I'd appreciate it if you could send the report by Friday.",
      ja: "金曜までにレポートをお送りいただけると助かります。",
      hint: "I'd は短く。send the は「セン(ド)ザ」のように /d/ を弱く。",
    },
  ],
  advanced: [
    {
      en: "The phenomenon was thoroughly analyzed by the researchers.",
      ja: "その現象は研究者たちによって徹底的に分析された。",
      hint: "phenomenon /fəˈnɑːmənən/ の強勢は2音節目。thoroughly の /θ/ と /r/ に注意。",
    },
    {
      en: "She specifically requested a vegetarian alternative.",
      ja: "彼女は特にベジタリアン用の代替を希望した。",
      hint: "specifically /spəˈsɪfɪkli/ の強勢は2音節目。語末 -ally は弱く。",
    },
    {
      en: "I am genuinely curious about your perspective on this issue.",
      ja: "この問題に対するあなたの見解に純粋に興味があります。",
      hint: "genuinely /ˈdʒenjuɪnli/、perspective /pəˈspektɪv/ の強勢を意識。",
    },
    {
      en: "The accumulated data suggests a significant correlation.",
      ja: "蓄積されたデータは有意な相関を示唆している。",
      hint: "accumulated, significant, correlation の長い語は強勢の位置を要確認。",
    },
    {
      en: "Although it was raining, we decided to go for a walk anyway.",
      ja: "雨が降っていたけれど、私たちはとにかく散歩に出かけることにした。",
      hint: "Although /ɔːlˈðoʊ/ の /ð/ と二重母音、anyway はリンクして滑らかに。",
    },
  ],
  // ミニマルペア — 似た音の区別練習
  "minimal-pairs": [
    {
      en: "I need to read the book about the red car.",
      ja: "赤い車についての本を読む必要がある。",
      hint: "read /riːd/ と red /red/。母音の長さに注意。",
    },
    {
      en: "She will collect the correct letter.",
      ja: "彼女は正しい手紙を集めるだろう。",
      hint: "collect の /l/ と correct の /r/ を意識して区別。",
    },
    {
      en: "The vet had a very bad day.",
      ja: "獣医は本当にひどい日を過ごした。",
      hint: "vet /v/, very /v/ と bad /b/ の対比。/v/ は下唇を噛む。",
    },
    {
      en: "Please sit on the seat near the sheet of paper.",
      ja: "紙のそばの席に座ってください。",
      hint: "sit /ɪ/ と seat /iː/ と sheet /iː/。短い /ɪ/ は緊張させない。",
    },
    {
      en: "He thinks the singer should sing thirty songs.",
      ja: "彼は歌手が30曲歌うべきだと思っている。",
      hint: "thinks /θ/, sing /s/, thirty /θ/, songs /s/。/θ/ と /s/ の使い分け。",
    },
    {
      en: "The light on the right is bright at night.",
      ja: "右側の明かりは夜にはまぶしい。",
      hint: "light /l/ と right /r/。/l/ は舌を上歯茎に、/r/ は舌を口の中で浮かせる。",
    },
  ],
};
