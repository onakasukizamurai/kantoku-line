(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Kantoku = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const STAGES = [
    {
      id: "issue",
      ask: "今の話の論点を、一文で言い切って。",
      probe: function (q) {
        return (
          "話題と論点が、まだ溶けてる。\n" +
          q + " は話題としては入ってる。でも、何を決めたいのかが無い。\n" +
          "練習の話なのか、優先順位の話なのか、気持ちの整理なのか。そこが違うと、このあと聞くことも全部変わる。\n" +
          "論点は「今週、自分はどこまで責任を持つか」みたいな、判断の芯のこと。話題の名前じゃない。"
        );
      },
    },
    {
      id: "purpose",
      ask: "目的を、手段の言葉を使わずに一文で書いて。",
      probe: function (q) {
        return (
          "で、目的。\n" +
          "やり方の話はまだいい。" + q + " が、手段の言い換えで終わってないか。\n" +
          "大会に出る、練習に行く、就活を進める。これはだいたい手段の側だよ。\n" +
          "その先で、何が手に入っていたら成功なのか。手段の単語をどかして、残った文が目的。"
        );
      },
    },
    {
      id: "evidence",
      ask: "なぜそう言い切れるのか、根拠を一つ、事実で出して。",
      probe: function () {
        return (
          "次は根拠。\n" +
          "なぜそれが目的、もしくは今の判断だと言い切れるのか。\n" +
          "「気がする」「なんとなく」は、根拠の席に座らせない。願望は事実じゃない。\n" +
          "過去に何が起きたか、今どの制約があるか、自分が何を基準にしてるか。観測できるものを一つ。"
        );
      },
    },
    {
      id: "choice",
      ask: "自分の意思として何を選ぶか、条件があるなら条件ごと書いて。",
      probe: function () {
        return (
          "選択肢を、自分で置いて選んで。\n" +
          "続ける、絞る、止める。このどれに近いか。\n" +
          "両方もっともらしいままだと、人は忙しいほうへ流される。流された結果を、あとから「自分で決めた」とは呼ばない。\n" +
          "条件つきでいい。条件も同じ文に入れて。条件が書けない選択は、まだ選択じゃない。"
        );
      },
    },
    {
      id: "done",
      ask: "期限つきの完了条件を、「頑張る」を使わず成果で書いて。",
      probe: function () {
        return (
          "完了条件が無い計画は、気分。\n" +
          "いつまでに、何が手元にあれば「やった」と言えるのか。\n" +
          "「進める」「やってみる」は禁止。成果物か、状態の変化で書いて。\n" +
          "期限は日付でも、次の練習まで、でもいい。区切りが無いと、また「とりあえず」に戻る。"
        );
      },
    },
    {
      id: "owner",
      ask: "その完了を、誰が何を見たら達成か書いて。",
      probe: function () {
        return (
          "最後に、判定者。\n" +
          "その完了を、誰が見て、何が揃っていたら達成なのか。\n" +
          "自分の気分か。記録に残るか。第三者に説明できるか。\n" +
          "ここが「なんとなく満足」だと、同じ会話が来週も来る。それは目的の未達じゃなくて、判定を置いてないだけ。"
        );
      },
    },
  ];

  const ASIDES = [
    "（手段から入る人は、忙しくなったときに全部止まる。目的があると、削る場所が分かる。それだけの話。）",
    "（この状態、昔の現場だと「論点が立ってない」と言う。悪口じゃなくて、まだ作業が始まってない、という意味。）",
    "（「忙しい」は誰にでも当てはまる。誰にでも当てはまる言葉は、意思決定の理由にならない。）",
    "（僕が答えを出すのは簡単なんだけど、それをやると、同じ質問が来週また来る。あなたの時間の使い方として、どうなの。）",
    "（感覚は大事。ただ感覚のまま渡されると、相手は同意か慰めしか返せない。欲しいの、それ？）",
    "（「考えてます」は進行中の報告であって、返事じゃない。考えると決めるは、別の動作。）",
    "（制約を並べるのは、現状認識としては正しい。その次に、制約のもとで何を守るかが無いと、ただの天気予報。）",
    "（言葉がふわっとしたままだと、あとで「そんなつもりじゃなかった」が使える。その逃げ道、自分で残してない？）",
    "（で、ちょっと話がそれるけど。質問に質問で返すのは性格が悪いように見えるよね。ただ、空の質問に手順だけ載せても、あなたの判断にはならない。）",
  ];

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function clip(s, n) {
    if (s.length <= n) return s;
    return s.slice(0, n) + "…";
  }

  function focusSentence(text) {
    const cleaned = text.replace(/\s+/g, " ").trim();
    const parts = cleaned
      .split(/[。！？?!]/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    const chosen =
      parts.length >= 2 && parts[parts.length - 1].length >= 8
        ? parts[parts.length - 1]
        : parts[0] || cleaned;
    return clip(chosen.replace(/[「」]/g, ""), 42);
  }

  function analyze(text) {
    const t = text.trim();
    const compact = t.replace(/\s/g, "");
    const hedgeLex = [
      "ちょっと",
      "なんか",
      "なんとなく",
      "まあ",
      "まぁ",
      "多分",
      "たぶん",
      "おそらく",
      "一旦",
      "とりあえず",
      "一応",
      "かもしれない",
      "気がする",
      "と思う",
      "思ってます",
      "思ってる",
      "感じ",
      "よく分から",
      "わからない",
      "分かんない",
      "わからん",
    ];
    const hedges = hedgeLex.filter(function (w) {
      return t.includes(w);
    });
    return {
      raw: t,
      n: compact.length,
      hedges: hedges,
      short: compact.length < 12,
      long: compact.length > 90,
      how: /どうすれば|どうしたら|教えて|アドバイス|どう思う|どうしたらよい|どうしたらいい/.test(t),
      busy: /忙|時間がない|時間ない|余裕がない|余裕ない/.test(t),
      cant: /無理|できない|むり|むずかし|難し|しんど|きつい/.test(t),
      ok: /大丈夫|なんとか|平気|問題ない/.test(t),
      tryhard: /頑張|やります|やってみ|動きます|進めます|進めよう/.test(t),
      vague: /わかんない|わからない|分かんない|よく分|迷って|不安|自信がない/.test(t),
      toriaezu: /とりあえず|一旦|一応/.test(t),
    };
  }

  function isDodge(text, f) {
    const t = text.trim();
    const n = f.n;
    if (/^(うん|はい|おけ|OK|ok|りょ|了解|わかりました|分かった|大丈夫|なるほど|笑|ｗ+|w+)[。！!\s]*$/.test(t)) {
      return true;
    }
    if (n < 8) return true;
    const hasReason = /から|ので|ため|理由|なぜなら|だって|だから/.test(t);
    const hasCommit = /する|しない|やる|やらない|やめる|行く|行かない|参加|休む|選|にする|したい|したくない|優先|言い切/.test(t);
    const concrete = /\d|明日|今日|今週|来週|月曜|火曜|水曜|木曜|金曜|土曜|日曜|具体|成果|目的|根拠|論点|期限/.test(t);
    if (n >= 40 && (hasReason || hasCommit || concrete)) return false;
    if (hasReason && hasCommit && n >= 16) return false;
    if (concrete && hasCommit && n >= 18) return false;
    if (f.hedges.length && n < 28 && !hasReason) return true;
    if ((f.cant || f.busy || f.ok || f.tryhard || f.vague || f.toriaezu) && !hasReason && !concrete && n < 36) {
      return true;
    }
    if (f.how && !hasReason && n < 40) return true;
    if (n < 18) return true;
    return false;
  }

  function qOf(quote) {
    return "「" + quote + "」";
  }

  function crack(quote, f, rng, dodge, tone) {
    const q = qOf(quote);
    if (tone === "deflect") {
      return pick(rng, [
        "聞き方が、相手に決めてもらう形になってる。\n" +
          q + " には、あなたの目的が入ってない。\n" +
          "目的が空のままの「どうすれば」は、一般論しか返せない。欲しいのが自分の判断なら、順番が逆。",
        "その質問、僕が答えた瞬間に、あなたの質問じゃなくなる。\n" +
          "手順は出せる。ただ手順は、目的のあとにしか意味がない。\n" +
          "今やってるのは、決めたくないことの置き場所になってない？",
      ]);
    }
    if (tone === "vague") {
      return pick(rng, [
        q + " は感触であって、判断じゃない。\n何が足りないのか。事実か、基準か、決めたあとの面倒か。この三つ、対処が全部違う。\n混ぜたまま渡されても、僕は感想しか返せない。",
        "強度を下げてる。\n" +
          q + "\n" +
          "曖昧語を抜いて書き直すと、何が残る。残らないなら、まだ判断してない。してないなら、してないと言って。",
      ]);
    }
    if (tone === "direct") {
      return pick(rng, [
        q + "、は判断の形になってる。ここは否定しない。\nただ、言葉がきれいでも、中身が手段止まりのことがある。そこだけ見る。",
        "文としては受け取れる。曖昧語で逃げてはいない。\nなので次は、言い回しの話じゃなくて中身の話をする。",
      ]);
    }
    if (f.how) {
      return pick(rng, [
        "聞き方が、相手に決めてもらう形になってる。\n" +
          q + " には、あなたの目的が入ってない。\n" +
          "目的が空のままの「どうすれば」は、誰にでも当てはまる一般論しか返せない。一般論が欲しいなら、それでいい。欲しいのが自分の判断なら、順番が逆。",
        "その質問、僕が答えた瞬間に、あなたの質問じゃなくなる。\n" +
          "手順は出せる。ただ手順は、目的のあとにしか意味がない。\n" +
          "今欲しいのはアドバイスに見えて、本当は「決めたくない」の置き場所になってない？ なってたら、先にそれを認めたほうが早い。",
      ]);
    }
    if (f.short) {
      return pick(rng, [
        q + "。情報量が少なすぎる。\n状況も、自分の意思も、次に何をしたいかも、この一文からは復元できない。\n（復元しようとすると、僕の想像であなたの話を上書きすることになる。それはフェアじゃない。）",
        "短いこと自体はいい。結論は短いほうがいい。\nただ " + q + " は結論じゃなくて、入口で止まってる。入口を送られても、会話は始まらない。",
      ]);
    }
    if (f.toriaezu) {
      return pick(rng, [
        "「とりあえず」が入った時点で、方針の共有じゃなくて気分の共有に近い。\n" +
          q + "\n" +
          "とりあえず、の中身は三種類ある。まだ情報が足りない、決めたくない、本当は別のことをしたい。どれ。\n" +
          "ここを分けないと、来週の行動が全部ぼやける。",
        "「とりあえず進める」は、手段の宣言に見えて、実は何も決めてない。\n" +
          "進んだと言える状態が定義されてないまま動き出すと、疲れたころに「なんのためにやってたんだっけ」が来る。それ、今ここで一回聞いたほうが安い。",
      ]);
    }
    if (f.hedges.length >= 1 && (f.hedges.length >= 2 || f.n < 45)) {
      const words = f.hedges.slice(0, 3).join("」「");
      return pick(rng, [
        "「" + words + "」が先に来てる。\n" +
          "結論が出てないこと自体は、悪くない。ただ、出てないものを僕に預けられても、僕はあなたの意思決定者じゃない。\n" +
          q + " を、曖昧語を抜いて書き直すと何が残る。残らないなら、まだ判断してない。それでいいから、してないと言って。",
        "ぼかし言葉で強度を下げてる。\n" +
          q + "\n" +
          "「" + words + "」を抜いても文が成立するなら、それは飾り。成立しないなら、中身がまだ無い。どっちか、自分で見て。",
      ]);
    }
    if (f.ok) {
      return pick(rng, [
        "「大丈夫」「なんとか」は、状態の報告に見えて、中身が空。\n" +
          "何が大丈夫なのか。誰の基準で大丈夫なのか。崩れたときに何が起きるか。そこが無い安心は、会話を終わらせるための言葉だよ。\n" +
          "終わらせたいなら、終わらせたいと言ったほうがまだ正直。",
        q + " で一度閉じようとしてる。\n閉じるのはいい。閉じるなら、何を引き受けて閉じるのかまで書いて。引き受けが無い「大丈夫」は、返事として未完成。",
      ]);
    }
    if (f.tryhard && f.n < 50) {
      return pick(rng, [
        "「頑張る」は態度であって、計画じゃない。\n" +
          q + "\n" +
          "態度は受け取った。その次。何を、いつまでに、どの状態にしたら頑張ったことになるのか。\n" +
          "そこが空だと、頑張ったかどうかの判定が気分になる。気分の判定は、あとで必ず揉める。",
        "やる意思は見えた。意思と中身は別。\n中身が「やってみます」のままだと、僕は「うん、やって」としか返せない。それで前に進んだ会話、ほぼ無い。",
      ]);
    }
    if (f.busy) {
      return pick(rng, [
        "忙しい、は状況の描写であって、判断じゃない。\n" +
          q + "\n" +
          "忙しい中で何を優先して、何を捨てるのか。そこが空白だと、忙しさに使われて終わる。\n" +
          "（行けない、と、行く優先度を自分で下げた、は別の話。前者は制約、後者は意思決定。今言ってるのはどっち。）",
        "時間がない、はほぼ全員が言える。\n言える言葉で理由を作ると、理由に見えて、ただの天候になる。\nその天候のなかで、あなたが守るものを一つ残して。全部守れないのは、もう前提でいい。",
      ]);
    }
    if (f.cant || f.vague) {
      return pick(rng, [
        "「わからない」「むずかしい」は、結論じゃなくて感触。\n" +
          q + "\n" +
          "何がわからないのか。事実が足りないのか、基準が無いのか、決めたあとの面倒を見たくないのか。\n" +
          "この三つ、対処が全部違う。混ぜたまま渡されても、僕は感想しか返せない。",
        "むずかしい、で止めると、こちらの解釈を足さないと会話が再開しない。\n解釈を足した瞬間、それはあなたの話じゃなくなる。だから止めてる。\n足りないものだけ、名前をつけて。",
      ]);
    }
    if (f.long) {
      return pick(rng, [
        "長く書いてくれてる。読みはした。\nただ、長いことと論点が立ってることは別。\n一番言いたい場所をこちらで抜くと " + q + " のあたり。違ったら、あなたのほうで一行を指定して。僕の抜粋で論点を決めるのは違う。",
        "量は足りてる。構造が足りてない。\n事実、解釈、意思が、同じ塊に入ってる。\nこの三つを分けてくれないと、どこに同意してどこに反対すればいいか、こちらが選べない。",
      ]);
    }
    if (!dodge && f.hedges.length === 0) {
      return pick(rng, [
        q + "、は判断の形になってる。ここは否定しない。\nただ、言葉がきれいでも、中身が手段止まりのことがある。そこだけ見る。",
        "文としては受け取れる。曖昧語で逃げてはいない。\nなので次は、言い回しの話じゃなくて中身の話をする。",
      ]);
    }
    return pick(rng, [
      q + " は、今のところ報告か感触に見える。判断の文になってない。\n事実（何が起きてる）と、解釈（どう受け止めた）と、意思（だからどうする）が溶けてる。\n溶かしたままだと、反対のしようがない。反対する対象が無い。",
      "言ってることは拾えた。拾えたけど、まだ理由が無い。\nなぜその結論になるのかが一文も無いと、同意はできるけど、一緒に考えたことにはならない。",
    ]);
  }

  function opener(quote, f, rng, dodge, lap, advanced, tone) {
    if (tone === "vague") {
      return pick(rng, [
        "曖昧なまま置いてる。それ、返事の形をしてるだけ。",
        "ぼかして着地させてる。着地にはなってない。",
      ]);
    }
    if (tone === "deflect") {
      return pick(rng, [
        "質問で返してきた。",
        "決めるのを、こっちに渡そうとしてる。",
      ]);
    }
    if (tone === "direct") {
      return pick(rng, [
        "うん、今回は核がある。" + qOf(quote) + "。",
        "そこは判断として受け取った。逃げてはいない。",
      ]);
    }
    if (dodge) {
      return pick(rng, [
        "聞いてることから、ずれてる。",
        "状況は見えた。返事にはなってない。",
        "うん、それはそれとして。質問、置きっぱなしになってる。",
        "一度受け取ったように見えて、中身が回避になってる。",
      ]);
    }
    if (lap > 0 && advanced) {
      return pick(rng, [
        "一巡はした。言葉は出た。まだ具体が甘い。",
        "同じ段に戻す。前回より一段、具体にして。",
      ]);
    }
    if (advanced) {
      return pick(rng, [
        "そこは一文として受け取った。" + qOf(quote) + "。\n（この抜き方が違ってたら、違うところだけ直して。）",
        "なるほど。今回は、逃げてはいない。言葉にはなってる。",
        "うん。判断の形にはなってきた。ここからが中身。",
      ]);
    }
    return pick(rng, ["うん。", "読んだ。", "なるほど。"]);
  }

  function redo() {
    return "欲しいのは状況の追記じゃない。核になる一文が先。\n補足は、そのあとでいい。";
  }

  function closeLine(ask, dodge, lap, level, rng) {
    const bridge =
      level >= 2
        ? pick(rng, ["で、話を戻すと。\n", "なので、次の返事は短くていい。\n", "ここだけは外さないで。\n"])
        : "";
    if (dodge) return bridge + "次の一文は、これ以外いらない。\n" + ask;
    if (lap > 0) return bridge + "同じ問いを、抽象語を一個減らしてもう一回。\n" + ask;
    return bridge + "次はこれだけ答えて。\n" + ask;
  }

  function extraPush(rng) {
    return pick(rng, [
      "仮に二択を置く。\nA: 今の方針を、自分の意思として続ける。\nB: 一旦止めて、目的から書き直す。\n今日の時点で近いのはどっち。近い、でいい。先に選んで、理由は次の一文。",
      "はい、で終わらせない。はいのあとに、判断が一行要る。\nその一行が書けないなら、まだ決めてない。決めてないなら、決めてないと書いて。それが今の結論。",
      "相手に納得してほしい文章と、自分が決めた文章は別物。\n今書いてるのは、どっち。納得を取りにいく文なら、論点が「自分の意思」から「通し方」にすり替わってる。",
    ]);
  }

  const CHOICES = {
    issue: [
      [
        { tone: "vague", text: "ちょっとまだ整理できてないです" },
        { tone: "direct", text: "論点は、今週の練習をどこまで優先するかを自分で決めることです" },
        { tone: "deflect", text: "それって、どうすればいいんですか" },
      ],
      [
        { tone: "vague", text: "なんかモヤっとしてて、言葉にするのが難しいです" },
        { tone: "direct", text: "論点は、卒論と練習のどちらを今週の本丸にするかです" },
        { tone: "deflect", text: "監督なら、この場合どう判断しますか" },
      ],
    ],
    purpose: [
      [
        { tone: "vague", text: "とりあえず両方進めようと思ってます" },
        { tone: "direct", text: "目的は、大会で記録を出すことです。練習はそのための手段です" },
        { tone: "deflect", text: "目的って、何を書けば正解なんですか" },
      ],
      [
        { tone: "vague", text: "なんとなく成長できればいいかな、くらいです" },
        { tone: "direct", text: "目的は、提出に間に合う状態を自分で作ることです" },
        { tone: "deflect", text: "目的は監督から見ると何になりますか" },
      ],
    ],
    evidence: [
      [
        { tone: "vague", text: "なんとなくそんな気がしてます" },
        { tone: "direct", text: "根拠は、先週から睡眠が4時間を切って、フォームが崩れているからです" },
        { tone: "deflect", text: "根拠って、どのくらい具体なら足りますか" },
      ],
      [
        { tone: "vague", text: "たぶん前より疲れてるからだと思います" },
        { tone: "direct", text: "根拠は、直近2週のタイムが両方落ちていることです" },
        { tone: "deflect", text: "その根拠で合ってるか、見てもらえますか" },
      ],
    ],
    choice: [
      [
        { tone: "vague", text: "まあ、様子見でいい気がします" },
        { tone: "direct", text: "今週は練習を半分にして、残りは卒論を優先します" },
        { tone: "deflect", text: "どっちを選ぶのが正しいですか" },
      ],
      [
        { tone: "vague", text: "決めきれないので、一旦保留で" },
        { tone: "direct", text: "自分の意思として、次の試合までは練習を本丸にします" },
        { tone: "deflect", text: "選ぶ前に、監督の意見を聞きたいです" },
      ],
    ],
    done: [
      [
        { tone: "vague", text: "頑張って進めます" },
        { tone: "direct", text: "金曜までに序論を3ページ書いて、自分で読み返せる状態にします" },
        { tone: "deflect", text: "期限は、こっちで決めていいんですか" },
      ],
      [
        { tone: "vague", text: "できる範囲でやってみます" },
        { tone: "direct", text: "次の練習までに、課題のフォームを3本動画で残します" },
        { tone: "deflect", text: "完了のラインは監督が決めた方がよくないですか" },
      ],
    ],
    owner: [
      [
        { tone: "vague", text: "自分が納得したら、達成でいいです" },
        { tone: "direct", text: "金曜の夜に、第三者へ一文で説明できたら達成です" },
        { tone: "deflect", text: "誰かに見てもらわないと、ダメですか" },
      ],
      [
        { tone: "vague", text: "まあ、自分の中で分かってれば十分かなと" },
        { tone: "direct", text: "次の面談で、目的と期限を口頭で言えたら達成です" },
        { tone: "deflect", text: "判定は監督が見る形にした方がいいですか" },
      ],
    ],
  };

  function choices(state) {
    const idx = state.idx || 0;
    const stage = STAGES[idx % STAGES.length];
    const sets = CHOICES[stage.id];
    const lap = Math.floor(idx / STAGES.length);
    return sets[lap % sets.length];
  }

  function reply(text, state) {
    const level = 2;
    const nonce = state.nonce || 1;
    const tone = state.tone || null;
    const f = analyze(text);
    const quote = focusSentence(text);
    const dodge = tone === "direct" ? false : tone === "vague" || tone === "deflect" ? true : isDodge(text, f);
    let idx = state.idx || 0;
    const advanced = !dodge;
    if (advanced) idx += 1;

    const lap = Math.floor(idx / STAGES.length);
    const stage = STAGES[idx % STAGES.length];
    const ask = lap > 0 ? stage.ask.replace(/。$/, "。前回より具体で。") : stage.ask;
    const rng = mulberry32(hashStr(text + "|" + idx + "|" + level + "|" + nonce + "|" + (dodge ? "d" : "a")));

    const bubbles = [];
    bubbles.push(opener(quote, f, rng, dodge, lap, advanced, tone));

    const middle = [];
    middle.push(crack(quote, f, rng, dodge, tone));
    if (dodge) {
      middle.push(redo());
      if (level >= 2) middle.push(stage.probe(qOf(quote)));
    } else {
      if (lap > 0) {
        middle.push("同じ型を、もう一段深くやる。抽象の言い換えは、進んだことにしない。");
      } else if (idx > 0) {
        middle.push("ここまでを受けて、次の論点。");
      }
      middle.push(stage.probe(qOf(quote)));
    }
    if (level >= 2) {
      middle.push(pick(rng, ASIDES));
      if (level === 2 && rng() < 0.35) {
        middle.push("（責めてるんじゃない。曖昧なまま頷くほうが、あとであなたが困るから言ってる。）");
      }
    }
    if (level >= 3) middle.push(extraPush(rng));

    const close = closeLine(ask, dodge, lap, level, rng);
    if (level === 1) {
      bubbles[0] = bubbles[0] + "\n\n" + middle.join("\n\n") + "\n\n" + close;
    } else {
      bubbles.push(middle.join("\n\n"));
      bubbles.push(close);
    }

    return {
      bubbles: bubbles,
      idx: dodge ? state.idx || 0 : idx,
      pending: ask,
      dodge: dodge,
    };
  }

  function initial() {
    return {
      idx: 0,
      pending: STAGES[0].ask,
      level: 2,
      nonce: 1,
    };
  }

  function opening() {
    return [
      "今日は何の話からいく。",
      "結論からでいい。ただし『とりあえず』『なんか』『忙しい』は、結論として受け取らない。\n\n先にこれだけ。\n" + STAGES[0].ask,
    ];
  }

  return {
    reply: reply,
    initial: initial,
    opening: opening,
    choices: choices,
    stages: STAGES,
  };
});
