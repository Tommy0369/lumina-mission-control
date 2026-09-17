import Link from "next/link";
import { Button, Panel } from "@lumina/ui";

export default function HowToPage() {
  return (
    <>
      <header className="mc-header">
        <div>
          <h1>使い方</h1>
          <p>覚えることは、この流れだけ。</p>
        </div>
        <Link href="/">
          <Button variant="secondary">ホームへ</Button>
        </Link>
      </header>

      <Panel title="1. やりたいことを書く">
        <p style={{ margin: 0 }}>
          ホームの大きな欄に、普通の日本語で書く。
          「Google認証を追加したい」で十分。下の 3 問も選ぶ（おすすめAIの初推定用）。
        </p>
      </Panel>

      <Panel title="2. 作戦が出る（モデルと仕事量まで）">
        <p style={{ margin: 0 }}>
          各段に「どのアプリ・どのモデル・仕事量」の<strong>初推定</strong>が出る。
          3 問の答えと固定ルールから決まる。合わなければタスク画面で上書きしてよい。
        </p>
        <ol style={{ margin: "12px 0 0", paddingLeft: 20 }}>
          <li>場所を探す → Cursor · Composer 2.5 Fast</li>
          <li>本体をつくる → Claude Code · Opus 5 · 超高</li>
          <li>自分で確認する</li>
          <li>見直す → Codex · GPT-5.6 Sol · 高</li>
          <li>直して仕上げる → Cursor · Composer 2 / Auto</li>
        </ol>
      </Panel>

      <Panel title="ChatGPT / Codex で選ぶもの">
        <p style={{ margin: "0 0 8px" }}>
          「デフォルト / おすすめのモデルセット」ではなく、モデル名を直接選ぶ。
          仕事量は 低 / 中 / 高 / 極高 / ウルトラ。GPT-5.5 は極高まで（2026-10-14 退役）。
        </p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>軽い → GPT-5.6 Luna · 低</li>
          <li>いつもの → GPT-5.6 Terra · 中</li>
          <li>難しい → GPT-5.6 Sol · 高</li>
          <li>いちばん難しい → GPT-6 Astra · 極高（足りなければウルトラ）</li>
        </ul>
      </Panel>

      <Panel title="Claude Code で選ぶもの">
        <p style={{ margin: "0 0 8px" }}>
          仕事量は 低 / 中 / 高 / 超高 / 最大。ultracode は仕事量ではなく、その場のセッションモード。おすすめでは使わない。
        </p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>軽い → Haiku 4.5（仕事量なし）</li>
          <li>いつもの → Sonnet 5 · 高</li>
          <li>難しい → Opus 5 · 超高</li>
          <li>いちばん長い仕事 → Fable 5.1 · 最大</li>
        </ul>
      </Panel>

      <Panel title="3. いまの一歩だけやる">
        <p style={{ margin: 0 }}>
          モデル名と仕事量を合わせて選ぶ → 依頼文をコピー → 作業 →
          「できた」か「つまった」。
        </p>
      </Panel>

      <Panel title="4. 申し送りを見て次へ">
        <p style={{ margin: 0 }}>
          終わると「次は誰に何を渡すか」が出る。完成まで繰り返す。
        </p>
      </Panel>
    </>
  );
}
