// src/sections/Mvp.jsx — MVP検証用デモページ
import React, { useEffect, useMemo, useState } from 'react';

const CHECK_ITEMS = [
  { id: 'timestamp', label: '投稿日時の表示',   detail: '投稿日時・タイムスタンプが明示されているか' },
  { id: 'reply',     label: '返信先表示',       detail: 'リプライ先や引用元の表示が自然に残っているか' },
  { id: 'ui',        label: 'UI整合性',         detail: 'アカウント名・ID・ボタン配置が公式UIと整合しているか' },
  { id: 'layout',    label: '文字配置・余白',    detail: '行間や余白の処理に不自然さがないか' },
  { id: 'crop',      label: '切り抜き・トリミング疑い', detail: '画像端や色調の不一致、再保存痕跡がないか' },
];

const AI_STEPS = [
  { id: 'ui',   label: 'UI整合性チェック',   ms: 900 },
  { id: 'text', label: '文字領域チェック',   ms: 850 },
  { id: 'meta', label: 'メタ情報確認',       ms: 800 },
  { id: 'crop', label: '境界・再圧縮解析',   ms: 750 },
];

// AI判定結果（demo: 要追加確認）
const AI_FINDINGS = [
  { tone: 'flag', title: '投稿日時の表示が確認できない',     note: '通常表示される時刻情報の領域に欠落が見られます。' },
  { tone: 'flag', title: '返信先表示の手がかりがない',       note: 'リプライ構造を示すUI部品が検出されませんでした。' },
  { tone: 'soft', title: '右端でトリミング痕跡の可能性',     note: 'エッジ周辺で圧縮ノイズの不連続性があります（要追加確認）。' },
];

const VERDICT = {
  level: 'review',
  label: '要追加確認',
  hint: '改変の確証はないものの、本来あるはずの表示が一部欠落しているため追加の検証を推奨します。',
};

export default function Mvp() {
  const [checks, setChecks] = useState({});
  const [aiStarted, setAiStarted] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [aiDone, setAiDone] = useState(false);

  const toggle = (id) =>
    setChecks((p) => ({ ...p, [id]: !p[id] }));

  const startAi = () => {
    setAiDone(false);
    setStepIdx(0);
    setAiStarted(true);
  };

  const resetAi = () => {
    setAiStarted(false);
    setAiDone(false);
    setStepIdx(-1);
  };

  useEffect(() => {
    if (!aiStarted || stepIdx < 0 || stepIdx >= AI_STEPS.length) return;
    const t = setTimeout(() => {
      if (stepIdx + 1 >= AI_STEPS.length) {
        setStepIdx(AI_STEPS.length);
        setAiDone(true);
      } else {
        setStepIdx(stepIdx + 1);
      }
    }, AI_STEPS[stepIdx].ms);
    return () => clearTimeout(t);
  }, [aiStarted, stepIdx]);

  const manualFlagged = useMemo(
    () => CHECK_ITEMS.filter((c) => checks[c.id]).length,
    [checks]
  );

  const aiFlagged = AI_FINDINGS.filter((f) => f.tone === 'flag').length;
  const aiSoft = AI_FINDINGS.filter((f) => f.tone === 'soft').length;

  const compareRows = CHECK_ITEMS.map((c) => {
    const manual = checks[c.id] ? 'flag' : 'ok';
    // AI観点のマッピング: timestamp/reply はflag、cropはsoft、それ以外ok
    const aiMap = { timestamp: 'flag', reply: 'flag', crop: 'soft' };
    const ai = aiMap[c.id] || 'ok';
    return { id: c.id, label: c.label, manual, ai };
  });

  return (
    <>
      <section className="mvp-hero" id="mvp-top">
        <div className="container">
          <div className="eyebrow"><span className="dot" /> MVP / 弁護士向け 違和感確認デモ</div>
          <h1 className="mvp-title">
            スクリーンショットの<span className="accent">違和感</span>を、<br />
            手作業 × AI判定風 で<br />
            <span className="accent">2分以内</span>に並べて見る。
          </h1>
          <p className="mvp-sub">
            誹謗中傷・なりすまし案件で問題になりがちな「本来あるはずの表示の欠落」「トリミング痕跡」「出所不明」を、
            <br />
            <strong>左の手作業チェック</strong> と <strong>右のAI判定風スキャン</strong> で同じ観点から並列確認します。
            <br />
            真偽を断定するのではなく、<strong>追加確認すべき優先順位</strong> を素早く付けるための補助ツールです。
          </p>
        </div>
      </section>

      <section className="mvp-stage no-border" id="mvp">
        <div className="container">
          <div className="mvp-toolbar">
            <span className="dots"><span /><span /><span /></span>
            <span className="path">/cases/2026-05-19/screenshot_001.jpg</span>
            <span className="badge">CASE</span>
            <span className="mvp-meta">受領: 2026-05-19 14:32 · 担当: 山口弁護士</span>
          </div>

          <div className="mvp-grid">
            {/* ====== 左: 手作業チェック ====== */}
            <div className="mvp-pane mvp-manual">
              <div className="pane-head">
                <span className="pane-tag">MODE.01</span>
                <h2>手作業チェック</h2>
                <p>裁判で問われやすい観点を自分の目で確認します。</p>
              </div>

              <ul className="check-list">
                {CHECK_ITEMS.map((c) => (
                  <li
                    key={c.id}
                    className={`check-item ${checks[c.id] ? 'flagged' : ''}`}
                    onClick={() => toggle(c.id)}
                  >
                    <span className="check-box" aria-hidden>
                      {checks[c.id] ? '!' : ''}
                    </span>
                    <div className="check-body">
                      <div className="check-label">{c.label}</div>
                      <div className="check-detail">{c.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="manual-summary">
                <div>
                  <span className="ms-key">違和感あり</span>
                  <span className={`ms-val ${manualFlagged > 0 ? 'warn' : ''}`}>{manualFlagged} / {CHECK_ITEMS.length}</span>
                </div>
                <div className="ms-hint">
                  {manualFlagged === 0 && 'チェック未実施 / 違和感なし'}
                  {manualFlagged > 0 && manualFlagged < 3 && '軽微な違和感あり'}
                  {manualFlagged >= 3 && '複数項目で違和感あり / 追加確認推奨'}
                </div>
              </div>
            </div>

            {/* ====== 中央: 画像プレビュー (仮) ====== */}
            <div className="mvp-pane mvp-preview">
              <div className="pane-head">
                <span className="pane-tag">EVIDENCE</span>
                <h2>対象スクリーンショット</h2>
                <p>仮の検証画像（プレースホルダ）</p>
              </div>

              <div className={`shot-frame ${aiStarted && !aiDone ? 'scanning' : ''} ${aiDone ? 'analyzed' : ''}`}>
                <div className="shot-mock">
                  <div className="shot-bar">
                    <div className="shot-bar-dot" />
                    <div className="shot-bar-line" />
                  </div>
                  <div className="shot-row">
                    <div className="shot-avatar" />
                    <div className="shot-handle">
                      <div className="shot-name">@unknown_user_2026</div>
                      <div className="shot-name dim">(表示名情報なし)</div>
                    </div>
                  </div>
                  <div className="shot-text">
                    これは検証用のサンプル投稿テキストです。<br />
                    本来この位置に表示されるべき投稿日時／返信先表示が抜けている設定の仮スクリーンショットです。
                  </div>
                  <div className="shot-text dim short">
                    （※日時表示エリア欠落）
                  </div>
                  <div className="shot-footer">
                    <span>♡</span><span>↺</span><span>↗</span>
                  </div>
                  <div className="shot-crop-hint" title="右端でトリミング疑い" />
                </div>
                {aiStarted && !aiDone && <div className="shot-scan" />}
                {aiStarted && <div className="shot-grid" />}
              </div>

              <div className="mvp-actions">
                {!aiStarted && (
                  <button className="btn btn-primary" onClick={startAi}>
                    AI判定モードで分析 <span className="arrow">→</span>
                  </button>
                )}
                {aiStarted && (
                  <button className="btn" onClick={resetAi}>
                    最初からやり直す
                  </button>
                )}
                <span className="mvp-actions-hint">外部送信なし / ローカル試作</span>
              </div>
            </div>

            {/* ====== 右: AI判定風 ====== */}
            <div className="mvp-pane mvp-ai">
              <div className="pane-head">
                <span className="pane-tag">MODE.02</span>
                <h2>AI判定モード</h2>
                <p>あらかじめ定義したルールに沿った自動抽出風の表示です。</p>
              </div>

              {!aiStarted && (
                <div className="ai-idle">
                  中央の「AI判定モードで分析」ボタンから開始してください。<br />
                  4工程・約3秒の進行表示で結果を提示します。
                </div>
              )}

              {aiStarted && (
                <div className="ai-progress">
                  {AI_STEPS.map((s, i) => {
                    const status =
                      i < stepIdx || aiDone ? 'done'
                      : i === stepIdx ? 'running'
                      : 'pending';
                    return (
                      <div key={s.id} className={`ai-step ${status}`}>
                        <span className="ai-step-mark" />
                        <span className="ai-step-label">{s.label}</span>
                        <span className="ai-step-state">
                          {status === 'done' && 'OK'}
                          {status === 'running' && '解析中…'}
                          {status === 'pending' && 'wait'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {aiDone && (
                <>
                  <div className={`verdict-block verdict-${VERDICT.level}`}>
                    <div className="vb-label">最終判定</div>
                    <div className="vb-value">{VERDICT.label}</div>
                    <div className="vb-hint">{VERDICT.hint}</div>
                  </div>

                  <div className="ai-findings">
                    {AI_FINDINGS.map((f, i) => (
                      <div key={i} className={`ai-find ai-find-${f.tone}`}>
                        <b>{f.title}</b>
                        <span>{f.note}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ====== 下: 比較表 + 簡易レポート ====== */}
          <div className="mvp-bottom">
            <div className="mvp-compare">
              <div className="pane-head">
                <span className="pane-tag">COMPARE</span>
                <h2>手作業 × AI判定 比較</h2>
              </div>

              <table className="compare-table">
                <thead>
                  <tr>
                    <th>観点</th>
                    <th>手作業</th>
                    <th>AI判定風</th>
                    <th>整合</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((r) => {
                    const match = r.manual === r.ai
                      || (r.manual === 'flag' && r.ai === 'soft')
                      || (r.manual === 'ok' && r.ai === 'soft');
                    return (
                      <tr key={r.id}>
                        <td>{r.label}</td>
                        <td><Cell tone={r.manual} /></td>
                        <td><Cell tone={aiDone ? r.ai : 'pending'} /></td>
                        <td className={match ? 'match' : 'mismatch'}>
                          {aiDone ? (match ? '一致' : '差分あり') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mvp-report">
              <div className="pane-head">
                <span className="pane-tag">REPORT</span>
                <h2>簡易レポート</h2>
              </div>

              <div className="report-card">
                <div className="rc-row">
                  <span className="rc-key">案件ID</span>
                  <span className="rc-val">CASE-2026-0519-001</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">最終判定</span>
                  <span className={`rc-val verdict-tag verdict-${VERDICT.level}`}>
                    {aiDone ? VERDICT.label : '未判定'}
                  </span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">手作業違和感</span>
                  <span className="rc-val">{manualFlagged} 項目</span>
                </div>
                <div className="rc-row">
                  <span className="rc-key">AI指摘</span>
                  <span className="rc-val">{aiDone ? `${aiFlagged}件 / 軽${aiSoft}件` : '—'}</span>
                </div>

                <div className="rc-block">
                  <div className="rc-h">怪しい点</div>
                  <ul>
                    <li>投稿日時の表示欠落</li>
                    <li>返信先表示が確認できない</li>
                  </ul>
                </div>

                <div className="rc-block">
                  <div className="rc-h">追加確認推奨</div>
                  <ul>
                    <li>元投稿の取得経路と取得時刻の聴取</li>
                    <li>右端のトリミング有無の原本確認</li>
                  </ul>
                </div>

                <div className="rc-block">
                  <div className="rc-h">証拠利用上の注意</div>
                  <ul>
                    <li>本判定は真贋を断定するものではありません。</li>
                    <li>追加確認の優先順位付け補助としてのみ使用してください。</li>
                  </ul>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => alert('レポート出力（デモ）: PDF/JSON保存を行う想定です。')}
                  disabled={!aiDone}
                >
                  レポートを保存 <span className="arrow">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Cell({ tone }) {
  if (tone === 'flag') return <span className="cell cell-flag">違和感</span>;
  if (tone === 'soft') return <span className="cell cell-soft">要確認</span>;
  if (tone === 'pending') return <span className="cell cell-pending">—</span>;
  return <span className="cell cell-ok">OK</span>;
}
