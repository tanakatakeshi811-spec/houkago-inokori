/* 「放課後の居残り」キャラ図鑑データ
   ゲーム本体 index.html 内のキャラ定義(KINDS/TCH=先生, STU=生徒)から抽出し、
   プレイヤー向けに読みやすく整形したもの。ゲーム本体のファイルは一切編集していない。
   自動生成スクリプト: 専門AI開発チームが1回だけ実行し、この静的ファイルとして書き出した。 */
const CHARACTERS = [
 {
  "id": "pe",
  "side": "teacher",
  "name": "体育教師",
  "tagline": "突進",
  "color": "#2f4858",
  "cd": 12,
  "intro": "",
  "abilities": [
   {
    "label": "突進",
    "text": "溜めた分だけ遠くへ飛び出し、通り道の生徒に1ダメージ"
   }
  ]
 },
 {
  "id": "math",
  "side": "teacher",
  "name": "数学教師",
  "tagline": "宿題トラップ",
  "color": "#3a3550",
  "cd": 12,
  "intro": "",
  "abilities": [
   {
    "label": "宿題トラップ",
    "text": "踏むと足が絡む。10連打で脱出、その後2秒重い"
   }
  ]
 },
 {
  "id": "jan",
  "side": "teacher",
  "name": "用務員",
  "tagline": "通気口ワープ",
  "color": "#384232",
  "cd": 7,
  "intro": "",
  "abilities": [
   {
    "label": "通気口ワープ",
    "text": "行き先を選んで潜る。出た後3秒加速＋5秒 気配なし"
   }
  ]
 },
 {
  "id": "model",
  "side": "teacher",
  "name": "人体模型",
  "tagline": "パーツ射出",
  "color": "#d6cdbb",
  "cd": 9,
  "intro": "",
  "abilities": [
   {
    "label": "パーツ射出",
    "text": "腕や臓器を直線に飛ばす。命中で1ダメージ＋減速"
   },
   {
    "label": "",
    "text": "追うほど振りが速くなる"
   }
  ]
 },
 {
  "id": "kok",
  "side": "teacher",
  "name": "コックリさん",
  "tagline": "鳥居のワープ",
  "color": "#5c2f3c",
  "cd": 10,
  "intro": "",
  "abilities": [
   {
    "label": "鳥居のワープ",
    "text": "鳥居へ瞬間移動。出た瞬間に近くの生徒へ狐憑き（操作が反転）"
   }
  ]
 },
 {
  "id": "vice",
  "side": "teacher",
  "name": "鬼塚教頭",
  "tagline": "校則違反",
  "color": "#3b2f22",
  "cd": 11,
  "intro": "",
  "abilities": [
   {
    "label": "校則違反",
    "text": "巨大な竹刀の広い振り下ろし。当たると20秒スキル封印"
   },
   {
    "label": "",
    "text": "監視の目で足がすくむ"
   }
  ]
 },
 {
  "id": "beet",
  "side": "teacher",
  "name": "ベートーヴェン像",
  "tagline": "不響和音",
  "color": "#cfc9bb",
  "cd": 13,
  "intro": "",
  "abilities": [
   {
    "label": "不響和音",
    "text": "直線に音波を放ち聴覚を奪って減速"
   },
   {
    "label": "",
    "text": "運命の旋律：一定時間内に課題が進まないと全員に1ダメージ"
   }
  ]
 },
 {
  "id": "chalk",
  "side": "teacher",
  "name": "チョークマン",
  "tagline": "黒板潜行",
  "color": "#1f2428",
  "cd": 14,
  "intro": "",
  "abilities": [
   {
    "label": "黒板潜行",
    "text": "3秒だけ壁をすり抜けて高速移動"
   },
   {
    "label": "",
    "text": "命中時にチョーク粉塵で視界を白く奪う。足跡も残らない"
   }
  ]
 },
 {
  "id": "teke",
  "side": "teacher",
  "name": "テケテケ",
  "tagline": "猛追",
  "color": "#6b2a2a",
  "cd": 18,
  "intro": "",
  "abilities": [
   {
    "label": "猛追",
    "text": "4秒 地を這って高速移動。這っている間の一撃は即ダウンの重傷になる"
   }
  ]
 },
 {
  "id": "mask",
  "side": "teacher",
  "name": "湖畔の仮面",
  "tagline": "瞬速／やり投げ",
  "color": "#3f4a32",
  "cd": 10,
  "intro": "",
  "abilities": [
   {
    "label": "瞬速",
    "text": "10秒CDで透明化して高速移動（足跡は残る）"
   },
   {
    "label": "やり投げ",
    "text": "命中で1ダメージ＋最大5m吹き飛ばし。槍は槍箱で補充"
   }
  ]
 },
 {
  "id": "dream",
  "side": "teacher",
  "name": "夢喰い",
  "tagline": "夢の罠／夢渡り",
  "color": "#8a2f28",
  "cd": 14,
  "intro": "",
  "abilities": [
   {
    "label": "夢喰い",
    "text": "60秒か被弾で生徒は眠りに落ちる。眠った相手は夢の罠で減速"
   },
   {
    "label": "",
    "text": "課題机へ夢渡り（眠っている人数が多いほど早い）"
   }
  ]
 },
 {
  "id": "anima",
  "side": "teacher",
  "name": "壊れた着ぐるみ",
  "tagline": "警備室ワープ／射出",
  "color": "#c9c24a",
  "cd": 12,
  "intro": "",
  "abilities": [
   {
    "label": "警備室",
    "text": "7つのドアを瞬時に行き来。使用中の生徒に出くわすと即捕縛"
   },
   {
    "label": "",
    "text": "射出パーツで衰弱（回復不可）と忘却（心音消失）"
   }
  ]
 },
 {
  "id": "fallen",
  "side": "teacher",
  "name": "落ち武者",
  "tagline": "影潜み／無念の一閃",
  "color": "#3b2f28",
  "cd": 8,
  "intro": "",
  "abilities": [
   {
    "label": "影潜み",
    "text": "心音と赤い光が消える"
   },
   {
    "label": "無念の一閃",
    "text": "溜めて突進斬り。板も一刀両断"
   },
   {
    "label": "",
    "text": "首級の渇望が満ちると20秒 怨霊化"
   }
  ]
 },
 {
  "id": "nurse",
  "side": "teacher",
  "name": "保健室の先生",
  "tagline": "念じ込み／貫通突進",
  "color": "#d8cfc6",
  "cd": 14,
  "intro": "",
  "abilities": [
   {
    "label": "念じ込み",
    "text": "左手の傷に念を込めて溜め、離すと壁も床も貫通して突進。2回まで連続可。突進後だけ攻撃でき、その後は必ず2秒スタン"
   }
  ]
 },
 {
  "id": "hunt",
  "side": "teacher",
  "name": "ハンティン先生",
  "tagline": "照準／銛（縄）",
  "color": "#5a6340",
  "cd": 12,
  "intro": "",
  "abilities": [
   {
    "label": "",
    "text": "照準（能力を押しっぱなし）＋発射（右クリック"
   },
   {
    "label": "行動）",
    "text": "命中した生徒を縄で7秒間ぐいぐい引き寄せる。生徒は連打で抵抗、5回ごとに1秒短縮"
   }
  ]
 },
 {
  "id": "dogman",
  "side": "teacher",
  "name": "人面犬",
  "tagline": "威嚇突進",
  "color": "#8a6b4a",
  "cd": 10,
  "intro": "",
  "abilities": [
   {
    "label": "威嚇突進",
    "text": "走り出すと20秒間止まれない。生徒に当たれば1ダメージ、板は破壊、壁に当たると終了。CD10秒"
   }
  ]
 },
 {
  "id": "oni",
  "side": "teacher",
  "name": "青鬼先生",
  "tagline": "青鬼エキス",
  "color": "#2f5aa8",
  "cd": 9,
  "intro": "",
  "abilities": [
   {
    "label": "青鬼エキス",
    "text": "ダウンした生徒に打つと青鬼の仲間になる（足は40%遅い）。開始時からマップに倒れた青鬼が3体いる"
   }
  ]
 },
 {
  "id": "clock",
  "side": "teacher",
  "name": "時計塔の刻乃",
  "tagline": "時間停止／巻き戻し",
  "color": "#6b5a3a",
  "cd": 30,
  "intro": "",
  "abilities": [
   {
    "label": "時間停止",
    "text": "半径14mの生徒を2.5秒完全に止める"
   },
   {
    "label": "巻き戻し",
    "text": "5秒前の位置へ自分だけ戻る"
   }
  ]
 },
 {
  "id": "shade",
  "side": "teacher",
  "name": "影絵のシルエット",
  "tagline": "影渡り／影縫い",
  "color": "#14161a",
  "cd": 16,
  "intro": "",
  "abilities": [
   {
    "label": "影渡り",
    "text": "影の分身を前方へ飛ばし、もう一度押すと入れ替わる"
   },
   {
    "label": "影縫い",
    "text": "視界内の生徒の影を縫って3秒動けなくする"
   }
  ]
 },
 {
  "id": "ink",
  "side": "teacher",
  "name": "禁書の墨吏",
  "tagline": "墨溜まり／書き換え",
  "color": "#2a2438",
  "cd": 14,
  "intro": "",
  "abilities": [
   {
    "label": "墨溜まり",
    "text": "インクの沼を作り、入った生徒の視界と音を奪って減速"
   },
   {
    "label": "書き換え",
    "text": "見えている課題の進行を10%奪い、作業者を照らす"
   }
  ]
 },
 {
  "id": "cat",
  "side": "teacher",
  "name": "給食室の化け猫",
  "tagline": "九尾の跳躍／鳴き真似",
  "color": "#8a6b3a",
  "cd": 11,
  "intro": "",
  "abilities": [
   {
    "label": "九尾の跳躍",
    "text": "壁も机も飛び越えて一直線に跳ぶ。着地際の一撃は範囲が広い"
   },
   {
    "label": "鳴き真似",
    "text": "狙った場所から偽の悲鳴を出し、生徒の心音を狂わせる"
   }
  ]
 },
 {
  "id": "monk",
  "side": "teacher",
  "name": "檻の猿・猿飛",
  "tagline": "枝渡り／投石",
  "color": "#6b4a35",
  "cd": 10,
  "intro": "",
  "abilities": [
   {
    "label": "枝渡り",
    "text": "どんな障害物も瞬時に乗り越え、越えるたび3秒加速"
   },
   {
    "label": "投石",
    "text": "石を投げて当たると0.8秒よろけさせ位置を暴く"
   }
  ]
 },
 {
  "id": "wolf",
  "side": "teacher",
  "name": "月夜の狼男",
  "tagline": "飛びかかり／追襲",
  "color": "#4a4038",
  "cd": 9,
  "intro": "",
  "abilities": [
   {
    "label": "",
    "text": "人間形態は48mまで生徒を感知。攻撃や板破壊で8秒の獣形態へ。飛びかかり（タップ7m"
   },
   {
    "label": "",
    "text": "溜め14m・障害物を跳び越える）は0.5ダメージ＋獲物マーク、マーク中に追撃でもう0.5。20秒ごとに現れる痕跡を拾うと速度+10%。存在感MAXでマークが消えにくくなる"
   }
  ]
 },
 {
  "id": "ripper",
  "side": "teacher",
  "name": "霧刃の紳士",
  "tagline": "霧の刃／寒意",
  "color": "#232630",
  "cd": 20,
  "intro": "",
  "abilities": [
   {
    "label": "霧の刃",
    "text": "壁を貫通して飛ぶ刃（0.5ダメージ）。当てた足元に霧の軌跡が残り、踏むと自分が加速"
   },
   {
    "label": "寒意",
    "text": "17秒何もしないと透明化して大幅加速（攻撃や板破壊で解除）。存在感MAXで透明化が早くなる"
   }
  ]
 },
 {
  "id": "wheel",
  "side": "teacher",
  "name": "軋車の三兄弟",
  "tagline": "車輪形態／悲鳴",
  "color": "#5a4a3a",
  "cd": 6,
  "intro": "",
  "abilities": [
   {
    "label": "車輪形態",
    "text": "爆速で走り、轢いた生徒に「刺」を最大3本刺す。板は轢き壊す"
   },
   {
    "label": "",
    "text": "人間形態に戻ると悲鳴が発動し、刺1本=0.5・2本=1.0・3本で即ダウン。仲間同士で刺を抜ける"
   }
  ]
 },
 {
  "id": "clown",
  "side": "teacher",
  "name": "三色道化",
  "tagline": "色爆弾／分身",
  "color": "#a83a4a",
  "cd": 5,
  "intro": "",
  "abilities": [
   {
    "label": "色爆弾",
    "text": "赤=スキル封印"
   },
   {
    "label": "",
    "text": "黒=減速"
   },
   {
    "label": "",
    "text": "白=課題が遅くなる。違う色を2つ以上重ねた相手への一撃は2倍。分身を置くと同時に2方向から爆弾が飛ぶ"
   }
  ]
 },
 {
  "id": "seitokai",
  "side": "teacher",
  "name": "風紀委員の亡霊",
  "tagline": "目付け／取り憑き突進",
  "color": "#352a40",
  "cd": 9,
  "intro": "",
  "abilities": [
   {
    "label": "目付け",
    "text": "見えている生徒に印を付ける（12秒間有効）"
   },
   {
    "label": "取り憑き突進",
    "text": "印を付けた生徒の隣へ距離を無視して瞬間移動する"
   }
  ]
 },
 {
  "id": "garden",
  "side": "teacher",
  "name": "花壇の見回り先生",
  "tagline": "スプリンクラー放水",
  "color": "#4a6b3a",
  "cd": 11,
  "intro": "",
  "abilities": [
   {
    "label": "スプリンクラー放水",
    "text": "半径10m以内の生徒に水をかけて3秒減速させる"
   }
  ]
 },
 {
  "id": "magnet",
  "side": "teacher",
  "name": "地学部顧問",
  "tagline": "磁力探知",
  "color": "#5a4a6b",
  "cd": 16,
  "intro": "",
  "abilities": [
   {
    "label": "磁力探知",
    "text": "進行中の課題プリントの位置をマップに感知する"
   }
  ]
 },
 {
  "id": "band",
  "side": "teacher",
  "name": "吹奏楽部顧問",
  "tagline": "指揮棒一閃",
  "color": "#2a2a3a",
  "cd": 13,
  "intro": "",
  "abilities": [
   {
    "label": "指揮棒一閃",
    "text": "2.5秒加速しつつ、見えている生徒の気配をマップに示す"
   }
  ]
 },
 {
  "id": "darknode",
  "side": "teacher",
  "name": "ダークノード",
  "tagline": "人間／狼／コウモリの3形態",
  "color": "#241a2e",
  "cd": 9,
  "intro": "能力2で3つの姿を切り替える怪人。",
  "abilities": [
   {
    "label": "人間形態",
    "text": "爪の一撃、能力1を1秒溜めて前方5m幅の火線（壁を貫通）"
   },
   {
    "label": "狼形態",
    "text": "三人称・速度+10%、生徒の足跡の匂いを踏むとさらに加速。通常攻撃は0.5秒溜めての組み付き突進(7m、板も破壊できるが失敗するとスタン)、外すと1秒以内にもう一度、連続で外すとスタン"
   },
   {
    "label": "コウモリ形態",
    "text": "三人称・速度3倍で浮遊し椅子や窓へ好きな場所へワープできる偵察専用形態。攻撃はできない代わりに、先生側からは生徒が直接見えず生徒の足跡だけが緑色に見える（生徒側からはコウモリの姿は普通に見える）"
   }
  ]
 },
 {
  "id": "photo",
  "side": "teacher",
  "name": "写真部顧問",
  "tagline": "暗室／現像モード切替・望遠観察",
  "color": "#2c2836",
  "cd": 4,
  "intro": "",
  "abilities": [
   {
    "label": "暗室モード",
    "text": "気配が0になる代わりやや遅い。能力1を押しっぱなしで望遠観察（さらに減速し、2.5〜32mの生徒が光って見える。最も近い1人からゲージが貯まり、5貯まると「決定的瞬間」に入れる）"
   },
   {
    "label": "現像モード",
    "text": "通常速度・気配16m・攻撃/破壊/スタン回復/間合いが強化。能力2でモード切替（3秒CD）"
   },
   {
    "label": "決定的瞬間",
    "text": "60秒だけ気配32m・現像モードの強化を維持したまま、攻撃ボタン長押しの「焼き付け」（離すと突進、命中で一撃行動不能・板も破壊できる）が使える。拘束2回の生徒に近づいて行動キーで「記念撮影」＝即脱落"
   }
  ]
 },
 {
  "id": "hanako",
  "side": "teacher",
  "name": "トイレの花子さん",
  "tagline": "個室渡り／ノックの数当て",
  "color": "#b5352f",
  "cd": 8,
  "intro": "",
  "abilities": [
   {
    "label": "個室渡り",
    "text": "通気口と同じ仕組みで、マップ上の個室（水道など）の間をワープする"
   },
   {
    "label": "ノックの数当て",
    "text": "近くで課題中の生徒にノック音を仕掛ける。同じ回数だけF/Jで叩き返せないと、しばらく課題が手につかなくなる"
   }
  ]
 },
 {
  "id": "kuchisake",
  "side": "teacher",
  "name": "口裂け女",
  "tagline": "斬撃ダッシュ／質問",
  "color": "#2c2c2c",
  "cd": 10,
  "intro": "",
  "abilities": [
   {
    "label": "",
    "text": "マスクを外す動作を溜めて解放すると、正面へ高速直線ダッシュ斬り（命中で出血＝継続ダメージ、板は破壊できない）"
   },
   {
    "label": "質問",
    "text": "近くの生徒に問いかける。正面で命中すれば数秒足止め、外すと反動で自分が数秒よろける（ハイリスク・ハイリターン）"
   }
  ]
 },
 {
  "id": "pool",
  "side": "teacher",
  "name": "プールの主",
  "tagline": "水脈渡り／浮上の金縛り",
  "color": "#1f4a4a",
  "cd": 8,
  "intro": "",
  "abilities": [
   {
    "label": "水脈渡り",
    "text": "通気口と同じ仕組みで、マップ上の水場（プール・噴水など）の間をワープする"
   },
   {
    "label": "",
    "text": "浮上した瞬間、視線が合っている生徒を数秒間 金縛り（操作不能）にする"
   }
  ]
 },
 {
  "id": "sewing",
  "side": "teacher",
  "name": "継ぎ接ぎさん",
  "tagline": "糸投げ（縫い止め）",
  "color": "#cfa876",
  "cd": 9,
  "intro": "",
  "abilities": [
   {
    "label": "糸投げ",
    "text": "遠くから糸を投げて命中した生徒を縫い止める（連打で脱出できる）。生徒を縫い止めるたびに「収集」が貯まり、少しずつ体が大きく・攻撃の隙が短くなる"
   }
  ]
 },
 {
  "id": "radio",
  "side": "teacher",
  "name": "放送室の主",
  "tagline": "偽の終業チャイム／校内放送ジャック",
  "color": "#24242c",
  "cd": 20,
  "intro": "",
  "abilities": [
   {
    "label": "偽の終業チャイム",
    "text": "発動すると、しばらく生徒全員のミニマップの位置表示が隠れる/ずれる"
   },
   {
    "label": "校内放送ジャック",
    "text": "生徒を1人名指しすると、その生徒の位置は全員に見えるようになる代わりに、放送を聞いた他の生徒はしばらく課題の進みが遅くなる"
   }
  ]
 },
 {
  "id": "mirror",
  "side": "teacher",
  "name": "にせもの",
  "tagline": "擬態／化け直し・正体を現す",
  "color": "#6b1f2c",
  "cd": 8,
  "intro": "",
  "abilities": [
   {
    "label": "擬態形態",
    "text": "試合開始時、生徒の誰かにそっくり化けている（速度も生徒並み・攻撃不可）。Q｜近くの別の生徒に化け直す"
   },
   {
    "label": "R",
    "text": "3秒の無防備な変身を経て正体を現す（片道）。正体形態｜通常の先生と同じ攻撃力。Q（ホールド）｜自分そっくりの偽物を3体ばら撒く。生徒をダウンさせるたび侵食ゲージが貯まり、満ちると60秒「二重人格」になり近くの生徒に成り代わって紛れられる"
   }
  ]
 },
 {
  "id": "sakasa",
  "side": "teacher",
  "name": "渡り廊下の逆さ女",
  "tagline": "壁走り／天井からの落下奇襲",
  "color": "#2a2438",
  "cd": 3,
  "intro": "",
  "abilities": [
   {
    "label": "床形態（3形態で一番遅い）",
    "text": "通常攻撃可。Q｜壁走り形態（狼並みの速さ・気配減少・攻撃不可）に変身"
   },
   {
    "label": "壁走り中に天井の張り付き地点でQ",
    "text": "天井形態（ホールドして待ち構え、真下を生徒が通ると自動で落下奇襲。外すと3秒動けない）。奇襲を3回決めると60秒「双子の逆さ女」になり、もう一体の逆さ女が同時出現する"
   }
  ]
 },
 {
  "id": "doll",
  "side": "teacher",
  "name": "人形塚の番人",
  "tagline": "人形投げ／人形の視線",
  "color": "#8a2f28",
  "cd": 9,
  "intro": "",
  "abilities": [
   {
    "label": "人形投げ",
    "text": "命中で数秒間 金縛り。人形は1個のみ、投げたら人形塚（槍箱と同じ地点）で補充。生徒を1人ダウンさせるか3分経過でレベル2（速度+8%・人形がブーメラン式に強化・R「人形の視線」で生徒の位置が見える）。さらに2人ダウン＋一定時間でレベル3（速度最大・Qが踏み込み範囲攻撃＝板も破壊できるに変化・人形の視線が常時発動）"
   }
  ]
 },
 {
  "id": "mane",
  "side": "teacher",
  "name": "モノマネキン",
  "tagline": "モノマネ（変身）",
  "color": "#cfc7b4",
  "cd": 0.4,
  "intro": "",
  "abilities": [
   {
    "label": "モノマネ",
    "text": "生徒を選んで変身。三人称・攻撃不可・心音が鳴らない。もう一度押すと解除（皮をはぎモノマネキンが出るモーションに2秒、周囲10m以内の生徒を2.2秒スタン。解除直後は0.5秒減速→0.4秒加速）"
   },
   {
    "label": "窓封鎖・板封鎖",
    "text": "向いている先の窓か板が常にピンク色でハイライトされ、能力2でそこを10秒封鎖（モノマネ人形を設置、CD15秒）。対象がすでに倒れている板なら即座に完全破壊してモノマネ人形を設置し、その場にいた生徒の足を40%遅くする"
   }
  ]
 },
 {
  "id": "stu_0_あおい",
  "side": "student",
  "name": "あおい",
  "short": "あおい",
  "tagline": "課題+12%",
  "color": "#3f6fb5",
  "hair": "#2b2118",
  "abilities": [
   {
    "label": "手が速い",
    "text": "課題+12%",
    "kind": "passive"
   }
  ]
 },
 {
  "id": "stu_1_ひかる",
  "side": "student",
  "name": "ひかる",
  "short": "ひかる",
  "tagline": "スタミナ消費-25%",
  "color": "#b54f6f",
  "hair": "#4a2f22",
  "abilities": [
   {
    "label": "体力自慢",
    "text": "スタミナ消費-25%",
    "kind": "passive"
   }
  ]
 },
 {
  "id": "stu_2_なぎさ",
  "side": "student",
  "name": "なぎさ",
  "short": "なぎさ",
  "tagline": "救助と回復+30%",
  "color": "#4fb58a",
  "hair": "#6b4a2f",
  "abilities": [
   {
    "label": "世話やき",
    "text": "救助と回復+30%",
    "kind": "passive"
   }
  ]
 },
 {
  "id": "stu_3_つかさ",
  "side": "student",
  "name": "つかさ",
  "short": "つかさ",
  "tagline": "もがき+35%",
  "color": "#b5934f",
  "hair": "#1f2a3a",
  "abilities": [
   {
    "label": "しぶとい",
    "text": "もがき+35%",
    "kind": "passive"
   }
  ]
 },
 {
  "id": "stu_4_疾風",
  "side": "student",
  "name": "一ノ瀬 疾風",
  "short": "疾風",
  "tagline": "乗り越え30%速",
  "color": "#d9552f",
  "hair": "#1f1a16",
  "abilities": [
   {
    "label": "軽快なフットワーク",
    "text": "乗り越え30%速",
    "kind": "passive"
   },
   {
    "label": "ラストスパート",
    "text": "3秒 大幅加速。使用後5秒は息切れで少し遅い",
    "kind": "active",
    "cd": 26
   }
  ]
 },
 {
  "id": "stu_5_小夜",
  "side": "student",
  "name": "小夜",
  "short": "小夜",
  "tagline": "課題+10%",
  "color": "#5a4f9b",
  "hair": "#241f2c",
  "abilities": [
   {
    "label": "速読マニュアル",
    "text": "課題+10%",
    "kind": "passive"
   },
   {
    "label": "校内図面",
    "text": "先生の居場所を3秒間 味方全員に共有。開始時にも自動発動",
    "kind": "active",
    "cd": 38
   }
  ]
 },
 {
  "id": "stu_6_まどか",
  "side": "student",
  "name": "結城 まどか",
  "short": "まどか",
  "tagline": "味方の治療が大幅に速い",
  "color": "#dcd8cc",
  "hair": "#8a5a3c",
  "abilities": [
   {
    "label": "応急手当",
    "text": "味方の治療が大幅に速い",
    "kind": "passive"
   },
   {
    "label": "救急キット",
    "text": "自分を1回だけ回復できる",
    "kind": "active",
    "cd": 0,
    "uses": 1
   }
  ]
 },
 {
  "id": "stu_7_葵",
  "side": "student",
  "name": "蓮見 葵",
  "short": "葵",
  "tagline": "物音の届く範囲-45%",
  "color": "#2f7d8c",
  "hair": "#201a18",
  "abilities": [
   {
    "label": "足音が小さい",
    "text": "物音の届く範囲-45%",
    "kind": "passive"
   },
   {
    "label": "フラッシュ撮影",
    "text": "正面の先生をフラッシュで2.4秒スタン（2回まで）",
    "kind": "active",
    "cd": 14,
    "uses": 2
   }
  ]
 },
 {
  "id": "stu_8_蓮",
  "side": "student",
  "name": "紫ノ宮 蓮",
  "short": "蓮",
  "tagline": "課題をやっている間に劇薬がたまる（最大3）",
  "color": "#6b4a8c",
  "hair": "#2a2230",
  "abilities": [
   {
    "label": "薬品調合",
    "text": "課題をやっている間に劇薬がたまる（最大3）",
    "kind": "passive"
   },
   {
    "label": "化学トラップ",
    "text": "足元に煙幕＋滑る薬品を設置。踏んだ先生は3秒 視界を失い転倒する",
    "kind": "active",
    "cd": 2,
    "uses": 1
   }
  ]
 },
 {
  "id": "stu_9_凛",
  "side": "student",
  "name": "神条 凛",
  "short": "凛",
  "tagline": "ダウンまでの粘りが強く",
  "color": "#24406b",
  "hair": "#161a20",
  "abilities": [
   {
    "label": "頑丈",
    "text": "ダウンまでの粘りが強く、押し返しに成功すると加速",
    "kind": "passive"
   },
   {
    "label": "仁王立ち",
    "text": "2秒の構え。攻撃を受け止めて無効化し先生を1.8秒よろけさせる／味方が担がれている時は体当たり救出（失敗すると自分が負傷）",
    "kind": "active",
    "cd": 30
   }
  ]
 },
 {
  "id": "stu_10_P-29",
  "side": "student",
  "name": "プロトタイプ29",
  "short": "P-29",
  "tagline": "課題が500%速い",
  "color": "#8a8f7a",
  "hair": "#1c1a18",
  "abilities": [
   {
    "label": "試作体",
    "text": "課題が500%速い",
    "kind": "passive"
   },
   {
    "label": "転移",
    "text": "1秒ごとに前方7mへ瞬間移動を3回。壁も通り抜ける",
    "kind": "active",
    "cd": 26
   }
  ]
 },
 {
  "id": "stu_11_響",
  "side": "student",
  "name": "鳴神 響",
  "short": "響",
  "tagline": "負傷中のうめき声と物音がとても小さい",
  "color": "#35566b",
  "hair": "#1e2430",
  "abilities": [
   {
    "label": "ノイズ・キャンセリング",
    "text": "負傷中のうめき声と物音がとても小さい",
    "kind": "passive"
   },
   {
    "label": "デコイ設置",
    "text": "小型スピーカーを設置（最大2台）。能力2で偽の悲鳴を鳴らして先生を誘導する",
    "kind": "active",
    "cd": 16,
    "uses": 2
   }
  ]
 },
 {
  "id": "stu_12_縁",
  "side": "student",
  "name": "遠野 縁",
  "short": "縁",
  "tagline": "先生に見られている間",
  "color": "#6b8a4a",
  "hair": "#3a2a1e",
  "abilities": [
   {
    "label": "画角",
    "text": "先生に見られている間、その先生の輪郭が自分にだけ見える",
    "kind": "passive"
   },
   {
    "label": "描き置き",
    "text": "自分そっくりの絵を置く。先生とBOTは6秒間そちらを追いかける",
    "kind": "active",
    "cd": 24,
    "uses": 2
   }
  ]
 },
 {
  "id": "stu_13_大河",
  "side": "student",
  "name": "獅子倉 大河",
  "short": "大河",
  "tagline": "板を倒すのと乗り越えが30%速い",
  "color": "#2a4a8a",
  "hair": "#1a1410",
  "abilities": [
   {
    "label": "肩が強い",
    "text": "板を倒すのと乗り越えが30%速い",
    "kind": "passive"
   },
   {
    "label": "フルスイング",
    "text": "目の前の先生をバットで殴って1.8秒よろけさせる。課題を2枚仕上げると撃ち直せる",
    "kind": "active",
    "cd": 0,
    "uses": 1
   }
  ]
 },
 {
  "id": "stu_14_みちる",
  "side": "student",
  "name": "九条 みちる",
  "short": "みちる",
  "tagline": "先生の接近を40mから感じ取れる",
  "color": "#4a6b5a",
  "hair": "#2a3a2a",
  "abilities": [
   {
    "label": "虫の知らせ",
    "text": "先生の接近を40mから感じ取れる",
    "kind": "passive"
   },
   {
    "label": "蟲寄せ",
    "text": "虫の群れを放ち、30m以内の先生を6秒間 味方全員に晒して3秒20%減速させる",
    "kind": "active",
    "cd": 30
   }
  ]
 },
 {
  "id": "stu_15_灯",
  "side": "student",
  "name": "久遠寺 灯（霊能力者）",
  "short": "灯",
  "tagline": "先生を見つめていると溜まる（7秒",
  "color": "#4a3a6b",
  "hair": "#1a1622",
  "abilities": [
   {
    "label": "魂ゲージ",
    "text": "先生を見つめていると溜まる（7秒",
    "kind": "passive"
   },
   {
    "label": "憑依",
    "text": "10m以内の先生に憑依して5秒間 操作を奪う。戻ると2秒間 足が40%速くなる",
    "kind": "active",
    "cd": 0
   }
  ]
 },
 {
  "id": "stu_16_クロ",
  "side": "student",
  "name": "黒猫のクロ",
  "short": "クロ",
  "tagline": "足跡を残さず物音が半分。九死に一生でダウンから一度だけ自力で起き上がる",
  "color": "#2a2a30",
  "hair": "#14141a",
  "abilities": [
   {
    "label": "忍び足",
    "text": "足跡を残さず物音が半分。九死に一生でダウンから一度だけ自力で起き上がる",
    "kind": "passive"
   },
   {
    "label": "跳躍",
    "text": "前方へ素早く跳ぶ。障害物も飛び越えて逃げ切る",
    "kind": "active",
    "cd": 18
   }
  ]
 },
 {
  "id": "stu_17_星那",
  "side": "student",
  "name": "綾瀬 星那",
  "short": "星那",
  "tagline": "先生の気配を32mと早めに察知できる",
  "color": "#2f3f7a",
  "hair": "#1a1e2a",
  "abilities": [
   {
    "label": "夜目",
    "text": "先生の気配を32mと早めに察知できる",
    "kind": "passive"
   },
   {
    "label": "星読み",
    "text": "残った課題と出口を8秒間 全員に光らせ、先生の現在地も刻む",
    "kind": "active",
    "cd": 40
   }
  ]
 },
 {
  "id": "stu_18_陽向",
  "side": "student",
  "name": "南雲 陽向",
  "short": "陽向",
  "tagline": "自分のスタミナ回復が速く",
  "color": "#d8a04a",
  "hair": "#2a1e14",
  "abilities": [
   {
    "label": "まかない",
    "text": "自分のスタミナ回復が速く、味方の治療も少し速い",
    "kind": "passive"
   },
   {
    "label": "差し入れ",
    "text": "おにぎりを置く。拾った味方はスタミナ全回復＋10秒 加速",
    "kind": "active",
    "cd": 20,
    "uses": 2
   }
  ]
 },
 {
  "id": "stu_19_剛",
  "side": "student",
  "name": "東雲 剛",
  "short": "剛",
  "tagline": "ダウンしてから力尽きるまでが50%長い",
  "color": "#1e2a3a",
  "hair": "#14100e",
  "abilities": [
   {
    "label": "胆力",
    "text": "ダウンしてから力尽きるまでが50%長い",
    "kind": "passive"
   },
   {
    "label": "受け流し",
    "text": "構えると次の一撃を弾いて先生を1.6秒よろけさせる（自動で受け止める）",
    "kind": "active",
    "cd": 55
   }
  ]
 },
 {
  "id": "stu_20_麗華",
  "side": "student",
  "name": "綾小路 麗華",
  "short": "麗華",
  "tagline": "自分が追われている間",
  "color": "#8c3f6b",
  "hair": "#d8c48a",
  "abilities": [
   {
    "label": "スポットライト",
    "text": "自分が追われている間、他の生徒の作業と治療が25%速くなる",
    "kind": "passive"
   },
   {
    "label": "カーテンコール",
    "text": "窓枠や板を越えた直後だけ発動でき、先生の視界を2秒 真っ白にする",
    "kind": "active",
    "cd": 22
   }
  ]
 },
 {
  "id": "stu_21_ネロ",
  "side": "student",
  "name": "ネロ",
  "short": "ネロ",
  "tagline": "ロッカーの中では息が漏れず心音も出ない",
  "color": "#2b2b33",
  "hair": "#3f3a46",
  "abilities": [
   {
    "label": "気配遮断",
    "text": "ロッカーの中では息が漏れず心音も出ない",
    "kind": "passive"
   },
   {
    "label": "偵察ドローン",
    "text": "6秒 上空からマップを確認できる。その間 本体は無防備",
    "kind": "active",
    "cd": 32
   }
  ]
 },
 {
  "id": "stu_22_心春",
  "side": "student",
  "name": "白瀬 心春",
  "short": "心春",
  "tagline": "仲間の救助が少し速い",
  "color": "#f0c9d4",
  "hair": "#c9a882",
  "abilities": [
   {
    "label": "保健委員",
    "text": "仲間の救助が少し速い",
    "kind": "passive"
   },
   {
    "label": "パルス蘇生",
    "text": "近くでダウンしている仲間を、順番待ちなしでその場に起こす（3回まで）。起こされた仲間はしばらく足が速くなる",
    "kind": "active",
    "cd": 8,
    "uses": 3
   }
  ]
 },
 {
  "id": "stu_23_翔",
  "side": "student",
  "name": "早乙女 翔",
  "short": "翔",
  "tagline": "乗り越え動作が少し速い",
  "color": "#2f5a44",
  "hair": "#1e1a16",
  "abilities": [
   {
    "label": "限界突破",
    "text": "乗り越え動作が少し速い",
    "kind": "passive"
   },
   {
    "label": "リミッター解除",
    "text": "スタミナを全回復し、4秒間 加速する",
    "kind": "active",
    "cd": 26
   }
  ]
 },
 {
  "id": "stu_24_なる",
  "side": "student",
  "name": "遠山 なる",
  "short": "なる",
  "tagline": "合図（チャット）のクールダウンが短い",
  "color": "#d6b23a",
  "hair": "#4a2f28",
  "abilities": [
   {
    "label": "放送部",
    "text": "合図（チャット）のクールダウンが短い",
    "kind": "passive"
   },
   {
    "label": "檄を飛ばす",
    "text": "「みんな、油断しないで！」――周囲の仲間全員を3秒間 加速させる",
    "kind": "active",
    "cd": 28
   }
  ]
 },
 {
  "id": "stu_25_弦",
  "side": "student",
  "name": "百目木 弦",
  "short": "弦",
  "tagline": "課題を進める速度が少し速い",
  "color": "#3a3f5c",
  "hair": "#24201c",
  "abilities": [
   {
    "label": "弓道部",
    "text": "課題を進める速度が少し速い",
    "kind": "passive"
   },
   {
    "label": "牽制の一矢",
    "text": "8〜24m先の視界内にいる先生を狙い、足を4秒止める",
    "kind": "active",
    "cd": 24
   }
  ]
 },
 {
  "id": "stu_26_栞",
  "side": "student",
  "name": "常盤 栞",
  "short": "栞",
  "tagline": "課題を進める速度が少し速い",
  "color": "#5c4a7a",
  "hair": "#2e2620",
  "abilities": [
   {
    "label": "図書委員",
    "text": "課題を進める速度が少し速い",
    "kind": "passive"
   },
   {
    "label": "残像",
    "text": "その場に自分の影武者を残しつつ、正面へ7m瞬間移動する",
    "kind": "active",
    "cd": 20
   }
  ]
 },
 {
  "id": "stu_27_静",
  "side": "student",
  "name": "静",
  "short": "静",
  "tagline": "完全に静止していると",
  "color": "#24344a",
  "hair": "#1c1a18",
  "abilities": [
   {
    "label": "残心",
    "text": "完全に静止していると、気配と足音がほとんど無くなる",
    "kind": "passive"
   }
  ]
 },
 {
  "id": "stu_28_転校生",
  "side": "student",
  "name": "転校生",
  "short": "転校生",
  "tagline": "怪談を知らないので",
  "color": "#4f6f9b",
  "hair": "#3a2e24",
  "abilities": [
   {
    "label": "知らぬが仏",
    "text": "怪談を知らないので、先生の気配が伝わる範囲が縮む",
    "kind": "passive"
   }
  ]
 },
 {
  "id": "stu_29_柔道部",
  "side": "student",
  "name": "柔道部",
  "short": "柔道部",
  "tagline": "先生に担がれている間",
  "color": "#f4f2ea",
  "hair": "#1a1612",
  "abilities": [
   {
    "label": "受け身",
    "text": "先生に担がれている間、その先生の移動速度を少し落とす",
    "kind": "passive"
   },
   {
    "label": "一本背負い",
    "text": "先生に組み付かれた(担がれた)瞬間だけ、タイミングよく発動キーを押すと投げ返してよろけさせ、逃げられる",
    "kind": "active",
    "cd": 24
   }
  ]
 },
 {
  "id": "stu_30_うらら",
  "side": "student",
  "name": "宗像 うらら",
  "short": "うらら",
  "tagline": "打たれ強い（ダウンから力尽きるまでが50%長い）",
  "color": "#8a7a5c",
  "hair": "#2a2018",
  "abilities": [
   {
    "label": "保健委員",
    "text": "打たれ強い（ダウンから力尽きるまでが50%長い）",
    "kind": "passive"
   },
   {
    "label": "狸寝入り",
    "text": "じっとして気配を殺す（1.5秒静止）と発動でき、気絶したふりをする。先生に担がれた瞬間、もう一度タイミングよく発動キーを押すと躱して自由になれる（失敗すると本当に担がれる）。成功時はしばらく先生に気づかれにくくなり、近くの仲間の作業も少し捗る",
    "kind": "active",
    "cd": 0
   }
  ]
 },
 {
  "id": "stu_31_しずく",
  "side": "student",
  "name": "文月 しずく",
  "short": "しずく",
  "tagline": "落ち着いた読書家（課題を進める速度が少し速い）",
  "color": "#5c6a8a",
  "hair": "#241f2c",
  "abilities": [
   {
    "label": "図書委員",
    "text": "落ち着いた読書家（課題を進める速度が少し速い）",
    "kind": "passive"
   },
   {
    "label": "護符の栞",
    "text": "追われていない時にQ｜本を読んで護符を貯める（最大3、本は3冊まで）。追われている時にQ｜護符を1つ使って自分か近くの仲間に身代わり札（次の1発を無効化）。R｜護符を1つ使って先生を1.5秒足止めし、周りの仲間も少し加速させる",
    "kind": "active",
    "cd": 3
   }
  ]
 },
 {
  "id": "stu_32_颯",
  "side": "student",
  "name": "久我 颯",
  "short": "颯",
  "tagline": "乗り越えが25%速く",
  "color": "#1d2029",
  "hair": "#14100e",
  "abilities": [
   {
    "label": "ステップワーク",
    "text": "乗り越えが25%速く、乗り越えた直後2.5秒だけ足が速くなる",
    "kind": "passive"
   },
   {
    "label": "ショウタイム",
    "text": "その場でひと踊りして仲間を鼓舞する。14m以内の仲間はスタミナ全回復＋4秒加速。ただし自分の位置が先生に知られる",
    "kind": "active",
    "cd": 28
   }
  ]
 },
 {
  "id": "stu_33_うた",
  "side": "student",
  "name": "宵野 うた",
  "short": "うた",
  "tagline": "6m以内に仲間がいる間",
  "color": "#2f3a56",
  "hair": "#3a2a20",
  "abilities": [
   {
    "label": "口ずさむ癖",
    "text": "6m以内に仲間がいる間、お互いの課題と手当てが18%捗る",
    "kind": "passive"
   },
   {
    "label": "ハーモニー",
    "text": "歌で場を整える。12m以内の仲間全員（自分も含む）の課題が8秒間35%速くなる",
    "kind": "active",
    "cd": 26
   }
  ]
 },
 {
  "id": "stu_34_ひな",
  "side": "student",
  "name": "黛 ひなぎく",
  "short": "ひな",
  "tagline": "自分が先生に追われている間",
  "color": "#3d2a4e",
  "hair": "#c9a33f",
  "abilities": [
   {
    "label": "声援",
    "text": "自分が先生に追われている間、仲間全員の足が6%速くなる",
    "kind": "passive"
   },
   {
    "label": "ハイタッチ",
    "text": "4m以内の仲間とハイタッチ。お互いの固有スキルのクールダウンが5秒縮み、3秒間 足が20%速くなる",
    "kind": "active",
    "cd": 18
   }
  ]
 }
];
