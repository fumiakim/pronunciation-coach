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
    {
      en: "Good morning, how are you?",
      ja: "おはよう、調子はどう？",
      hint: "morning の /ɔː/ は口を丸めて長く。are you はリンク「アーユ」。",
    },
    {
      en: "Nice to meet you.",
      ja: "はじめまして。",
      hint: "meet you は「ミーチュー」と繋がる。/iː/ は口を横に引いて長く。",
    },
    {
      en: "I'm sorry, I don't understand.",
      ja: "すみません、わかりません。",
      hint: "sorry の /ɑ/ は口を縦に開く。understand の強勢は「stand」に。",
    },
    {
      en: "Can you help me, please?",
      ja: "手伝ってもらえますか？",
      hint: "help の /l/ は舌先を上歯茎に。please の /pl/ は連続子音を意識。",
    },
    {
      en: "What time is it?",
      ja: "何時ですか？",
      hint: "What time は「ワッタイム」のようにリンク。time の /aɪ/ を伸ばし気味に。",
    },
    {
      en: "I'm a little tired today.",
      ja: "今日は少し疲れた。",
      hint: "little の /tl/ は flap T で「リル」に近い音。tired は2音節「タイアド」。",
    },
    {
      en: "Let's go for a walk.",
      ja: "散歩に行こう。",
      hint: "walk の /ɔː/ は口を丸めて長く、最後の /k/ は軽く破裂。",
    },
    {
      en: "It's a beautiful day.",
      ja: "いい天気ですね。",
      hint: "beautiful /ˈbjuːtɪfəl/ の強勢は最初。/b/ と /v/ の混同に注意。",
    },
    {
      en: "See you tomorrow.",
      ja: "また明日。",
      hint: "See you は「シーユー」とリンク。tomorrow の強勢は真ん中 /ˈmɑːroʊ/。",
    },
    {
      en: "Where is the bathroom?",
      ja: "トイレはどこですか？",
      hint: "bathroom の /θ/ は舌先を歯に。room の /r/ と /uː/ を丁寧に。",
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
    {
      en: "Could you please repeat that more slowly?",
      ja: "もう少しゆっくりもう一度言ってもらえますか？",
      hint: "repeat の強勢は後ろ /rɪˈpiːt/。slowly の /sl/ をはっきり分けて。",
    },
    {
      en: "I'm looking forward to seeing you again.",
      ja: "またお会いするのを楽しみにしています。",
      hint: "looking forward to: to は弱形 /tə/。seeing you はリンク「スィーィンギュー」。",
    },
    {
      en: "Let me know if you need any help.",
      ja: "何か必要があれば言ってください。",
      hint: "Let me は「レッミー」とリンク。any /ˈɛni/ の /æ/ ではなく /ɛ/。",
    },
    {
      en: "I think we should leave soon.",
      ja: "そろそろ出発した方がいいと思う。",
      hint: "think の /θ/、leave の /v/ をしっかり区別。should は弱く「シュッド」。",
    },
    {
      en: "What do you usually do on weekends?",
      ja: "週末はたいてい何をしますか？",
      hint: "What do you は「ワッドゥユ」のようにリンク。usually /ˈjuːʒuəli/ の /ʒ/ に注意。",
    },
    {
      en: "I've been studying English for three years.",
      ja: "3年間英語を勉強しています。",
      hint: "I've been: I've は弱く /aɪv/。three の /θr/ クラスタが難所。",
    },
    {
      en: "The traffic is really heavy this morning.",
      ja: "今朝は本当に渋滞している。",
      hint: "traffic の /tr/、really の /r/、morning の語末 /ŋ/ を意識。",
    },
    {
      en: "I'm not feeling very well today.",
      ja: "今日は調子が悪い。",
      hint: "feeling の /iː/ は長く。very の /v/ は下唇を噛む音。",
    },
    {
      en: "Would you mind if I opened the window?",
      ja: "窓を開けてもいいですか？",
      hint: "Would you は「ウッヂュ」。opened は /oʊpənd/、語末 /d/ は軽く。",
    },
    {
      en: "I really appreciate your kindness.",
      ja: "ご親切に本当に感謝します。",
      hint: "appreciate /əˈpriːʃieɪt/ の強勢は2音節目。/r/ と /l/ に注意。",
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
    {
      en: "The implications of this decision are far-reaching.",
      ja: "この決定の影響は広範囲に及ぶ。",
      hint: "implications /ˌɪmplɪˈkeɪʃənz/ の強勢は3音節目。far-reaching の /r/ クラスタ。",
    },
    {
      en: "We should consider all available alternatives.",
      ja: "利用可能なすべての選択肢を検討すべきだ。",
      hint: "consider, available, alternatives の母音 schwa /ə/ を多用。",
    },
    {
      en: "Unfortunately, the proposal was rejected.",
      ja: "残念ながら、提案は却下された。",
      hint: "Unfortunately の強勢は2音節目。語末 -ly は弱く。",
    },
    {
      en: "The committee unanimously approved the recommendation.",
      ja: "委員会は全会一致で推薦を承認した。",
      hint: "unanimously /juːˈnænəməsli/ の強勢は2音節目。recommendation の長さに注意。",
    },
    {
      en: "We need to streamline our manufacturing process.",
      ja: "製造プロセスを合理化する必要がある。",
      hint: "streamline /ˈstriːmlaɪn/ の /str/ クラスタ。manufacturing の強勢は3音節目。",
    },
    {
      en: "His remarkable achievement deserves recognition.",
      ja: "彼の素晴らしい業績は認められるに値する。",
      hint: "remarkable, achievement, recognition、それぞれ強勢位置を意識。",
    },
    {
      en: "She articulated her concerns very clearly.",
      ja: "彼女は懸念をはっきりと述べた。",
      hint: "articulated /ɑːrˈtɪkjuleɪtɪd/ の強勢は2音節目。/l/ と /r/ の連続に注意。",
    },
    {
      en: "The collaboration yielded unprecedented results.",
      ja: "その協力は前例のない結果をもたらした。",
      hint: "yielded の /jiː/、unprecedented /ʌnˈpresɪdentɪd/ の強勢は2音節目。",
    },
    {
      en: "We must prioritize sustainability over short-term gains.",
      ja: "短期的利益より持続可能性を優先しなければならない。",
      hint: "prioritize /praɪˈɔːrɪtaɪz/、sustainability /səˌsteɪnəˈbɪlɪti/ は長く強勢複数。",
    },
    {
      en: "The negotiations reached an impasse last evening.",
      ja: "交渉は昨夜行き詰まりに達した。",
      hint: "negotiations /nɪˌɡoʊʃiˈeɪʃənz/、impasse /ˈɪmpæs/ の /æ/ を意識。",
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
    {
      en: "I bought a bat at the back of the bag.",
      ja: "バッグの裏でバットを買った。",
      hint: "bat, back, bag はすべて /æ/。「ア」と「エ」の中間で口を横に開く。",
    },
    {
      en: "We saw the boat near the boot on the road.",
      ja: "道路上のブーツの近くにボートがあった。",
      hint: "boat /oʊ/, boot /uː/, road /oʊ/。/oʊ/ は二重母音、/uː/ は単一の長母音。",
    },
    {
      en: "Three free trees grow over there.",
      ja: "3本の自由な木があそこに生えている。",
      hint: "three /θr/, free /fr/, trees /tr/。子音クラスタを丁寧に。",
    },
    {
      en: "Wait by the gate at eight.",
      ja: "8時にゲートのそばで待って。",
      hint: "全部 /eɪ/。日本語の「エ」より少し /a/ から始まる二重母音。",
    },
    {
      en: "The chief thief showed his belief in grief.",
      ja: "その盗賊長は悲しみの中で自分の信念を示した。",
      hint: "全部 /iː/。口を横に強く引いて長く伸ばす音。",
    },
    {
      en: "She slipped the slipper on her foot.",
      ja: "彼女はスリッパを足に滑り込ませた。",
      hint: "slipped /slɪpt/, slipper /ˈslɪpər/。/sl/ クラスタを連続して発音。",
    },
    {
      en: "Pass the cap and the cup carefully.",
      ja: "帽子とカップを慎重に渡してください。",
      hint: "cap /æ/ と cup /ʌ/。/æ/ は横に開き、/ʌ/ は中央でリラックス。",
    },
    {
      en: "The fan moved fast in the van.",
      ja: "扇風機はバンの中で速く動いた。",
      hint: "fan, fast の /f/ と van の /v/。/f/ は息のみ、/v/ は声帯振動。",
    },
    {
      en: "He has a long thumb and a strong sum.",
      ja: "彼は長い親指と確かな合計を持っている。",
      hint: "thumb /θʌm/ と sum /sʌm/、long /lɔːŋ/ と strong /strɔːŋ/。子音差を意識。",
    },
  ],

  business: [
    {
      en: "I'd like to schedule a meeting for next Tuesday.",
      ja: "来週火曜にミーティングを設定したい。",
      hint: "schedule は米/ˈskedʒuːl/ 英/ˈʃedjuːl/。Tuesday の /tjuː/ または /tuː/。",
    },
    {
      en: "Could you send me the report by end of day?",
      ja: "終業までにレポートを送ってもらえますか？",
      hint: "Could you はリンク「クッヂュ」。end of day は「エンダブデイ」と滑らかに。",
    },
    {
      en: "Let's circle back on this next week.",
      ja: "この件は来週また議論しましょう。",
      hint: "circle /ˈsɜːrkəl/ の /sɜːr/ をしっかり。back on this のリンク。",
    },
    {
      en: "I'll get back to you with the details.",
      ja: "詳細は追ってご連絡します。",
      hint: "I'll get は「アイゲッ」のように /t/ を弱く。details の強勢は後ろ。",
    },
    {
      en: "We need to finalize the budget proposal.",
      ja: "予算案を確定する必要がある。",
      hint: "finalize /ˈfaɪnəlaɪz/、proposal /prəˈpoʊzəl/ の強勢に注意。",
    },
    {
      en: "The quarterly results exceeded expectations.",
      ja: "四半期業績は予想を上回った。",
      hint: "quarterly /ˈkwɔːrtərli/、exceeded /ɪkˈsiːdɪd/ の /ks/ クラスタ。",
    },
    {
      en: "Please find the attached document for your review.",
      ja: "添付の資料をご確認ください。",
      hint: "attached の /tʃ/、document の強勢は最初、review の /v/。",
    },
    {
      en: "I appreciate your prompt response.",
      ja: "迅速なご対応に感謝します。",
      hint: "appreciate, prompt, response、それぞれの /r/ を丁寧に。",
    },
    {
      en: "Could you clarify what you mean by that?",
      ja: "それはどういう意味か説明してもらえますか？",
      hint: "clarify /ˈklærəfaɪ/ の強勢は最初。what you はリンク「ワッチュー」。",
    },
    {
      en: "Let me know your availability for a call.",
      ja: "通話可能な時間を教えてください。",
      hint: "availability /əˌveɪləˈbɪləti/ は長語、強勢は4音節目。",
    },
    {
      en: "We're behind schedule on the project.",
      ja: "プロジェクトは予定より遅れている。",
      hint: "behind /bɪˈhaɪnd/、project (名) は前強勢 /ˈprɑːdʒekt/。",
    },
    {
      en: "I'll forward you the email shortly.",
      ja: "すぐにメールを転送します。",
      hint: "forward /ˈfɔːrwərd/ の二つの /r/、shortly の /ʃ/。",
    },
  ],

  travel: [
    {
      en: "I'd like to check in, please.",
      ja: "チェックインをお願いします。",
      hint: "check in はリンク「チェッキン」。please の /pl/ クラスタ。",
    },
    {
      en: "Do you have a table for two?",
      ja: "2名で席は空いていますか？",
      hint: "Do you have a はリンク「デュハバ」。table の /eɪ/。",
    },
    {
      en: "How much does this cost?",
      ja: "これはいくらですか？",
      hint: "How much はリンクして滑らかに。cost の /kɔːst/ の /ɔː/ を長く。",
    },
    {
      en: "Could you call me a taxi, please?",
      ja: "タクシーを呼んでもらえますか？",
      hint: "call の /ɔː/ を長く、taxi /ˈtæksi/ の /æ/ に注意。",
    },
    {
      en: "What time does the museum close?",
      ja: "美術館は何時に閉まりますか？",
      hint: "museum /mjuːˈziːəm/ の強勢は2音節目、3音節語。",
    },
    {
      en: "I'd like the chicken, medium rare.",
      ja: "チキンをミディアムレアで。",
      hint: "chicken の /tʃ/、medium /ˈmiːdiəm/ の長い母音、rare /reər/ の /r/。",
    },
    {
      en: "Is breakfast included in the room rate?",
      ja: "朝食は部屋代に含まれていますか？",
      hint: "breakfast /ˈbrekfəst/ の強勢は前。included の /klu/ クラスタ。",
    },
    {
      en: "Could I have the bill, please?",
      ja: "お会計をお願いします。",
      hint: "Could I はリンク「クッダイ」。bill の /b/ と /l/。",
    },
    {
      en: "Do you accept credit cards?",
      ja: "クレジットカードは使えますか？",
      hint: "accept /əkˈsept/ の強勢は後ろ、credit の /kr/ クラスタ。",
    },
    {
      en: "Where is the nearest train station?",
      ja: "一番近い駅はどこですか？",
      hint: "nearest /ˈnɪərɪst/ の /ɪər/、train の /tr/。",
    },
    {
      en: "I think I left my passport in the room.",
      ja: "部屋にパスポートを忘れたと思います。",
      hint: "passport /ˈpæspɔːrt/ の /pɔːrt/ を丁寧に。left の /lf/ クラスタ。",
    },
    {
      en: "Can I get a refund for this ticket?",
      ja: "このチケットの払い戻しはできますか？",
      hint: "refund (名) は前強勢 /ˈriːfʌnd/、ticket /ˈtɪkɪt/。",
    },
  ],

  "tongue-twisters": [
    {
      en: "She sells seashells by the seashore.",
      ja: "彼女は海辺で貝殻を売る。",
      hint: "/s/ と /ʃ/ の切替え練習。she /ʃ/, sells /s/, sea /s/, shells /ʃ/, shore /ʃ/。",
    },
    {
      en: "Peter Piper picked a peck of pickled peppers.",
      ja: "ピーター・パイパーは酢漬けピーマンをひとつかみ摘んだ。",
      hint: "/p/ の破裂音を連続で。すべての /p/ を息で破裂させる。",
    },
    {
      en: "How much wood would a woodchuck chuck?",
      ja: "ウッドチャックはどれくらい木を投げるだろう？",
      hint: "/w/ と /tʃ/ の連続。much, wood, would, woodchuck, chuck の母音差。",
    },
    {
      en: "Red lorry, yellow lorry, red lorry, yellow lorry.",
      ja: "赤いトラック、黄色いトラック、赤い…",
      hint: "/r/ と /l/ を交互に。日本語話者の最大の難所。舌の位置を意識して。",
    },
    {
      en: "Fresh fried fish, fish fresh fried.",
      ja: "揚げたての魚、揚げ立ての魚。",
      hint: "/f/ と /r/ と /ʃ/ の連続。/f/ は下唇を歯に。",
    },
    {
      en: "The thirty-three thieves thought they thrilled the throne.",
      ja: "33人の盗賊は王座をスリルさせたと思った。",
      hint: "/θ/ ばかり。舌先を歯につけて息を出す音を繰り返す。",
    },
    {
      en: "A proper copper coffee pot.",
      ja: "適切な銅製のコーヒーポット。",
      hint: "/p/ と /k/ の破裂音、/ɑ/ と /ɔː/ の母音差。",
    },
    {
      en: "Truly rural.",
      ja: "本当に田舎風。",
      hint: "/tr/, /ruː/, /r/, /əl/。/r/ と /l/ の連続が非常に難しい。",
    },
    {
      en: "Six slick slim sycamore saplings.",
      ja: "6本のなめらかで細い、シカモアの苗木。",
      hint: "/s/ と /sl/ の連続。子音クラスタを丁寧に区切らず流す。",
    },
    {
      en: "Betty bought a bit of better butter.",
      ja: "ベティはもう少しいいバターを少し買った。",
      hint: "/b/ と /t/ (flap T) の連続。butter は「バラー」に近い音。",
    },
  ],
};
