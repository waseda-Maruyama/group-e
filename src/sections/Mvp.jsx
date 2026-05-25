// src/sections/Mvp.jsx — MVP検証用デモページ
import React, { useEffect, useMemo, useRef, useState } from 'react';

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
  {
    id: 'timestamp',
    tone: 'flag',
    title: '投稿日時の表示が確認できない',
    note: '通常表示される時刻情報の領域に欠落が見られます。',
    caption: '時刻表示の欠落',
    box: { x: 10, y: 24, w: 50, h: 10 },
  },
  {
    id: 'reply',
    tone: 'flag',
    title: '返信先表示の手がかりがない',
    note: 'リプライ構造を示すUI部品が検出されませんでした。',
    caption: '返信先表示の欠落',
    box: { x: 10, y: 34, w: 56, h: 9 },
  },
  {
    id: 'crop',
    tone: 'soft',
    title: '右端でトリミング痕跡の可能性',
    note: 'エッジ周辺で圧縮ノイズの不連続性があります（要追加確認）。',
    caption: '右端トリミング疑い',
    box: { x: 92, y: 2, w: 7, h: 96 },
  },
];

const VERDICT = {
  level: 'review',
  label: '要追加確認',
  hint: '改変の確証はないものの、本来あるはずの表示が一部欠落しているため追加の検証を推奨します。',
};

export default function Mvp() {
  const [checks, setChecks] = useState({});
  const [customItems, setCustomItems] = useState([]);
  const [customNote, setCustomNote] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [aiStarted, setAiStarted] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [aiDone, setAiDone] = useState(false);
  const [captureBox, setCaptureBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const shotRef = useRef(null);
  const selectionStartRef = useRef(null);
  const MIN_CAPTURE = 2;

  const toggle = (id) =>
    setChecks((p) => ({ ...p, [id]: !p[id] }));

  const toggleCustom = (id) =>
    setCustomItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, flagged: !item.flagged } : item
      )
    );

  const removeCustom = (id) =>
    setCustomItems((items) => items.filter((item) => item.id !== id));

  const clampPercent = (value) => Math.min(100, Math.max(0, value));

  const getRelativePoint = (clientX, clientY) => {
    const rect = shotRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: clampPercent(x), y: clampPercent(y) };
  };

  const startCapture = (event) => {
    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) return;
    event.preventDefault();
    selectionStartRef.current = point;
    setCaptureBox({ x: point.x, y: point.y, w: 0, h: 0 });
    setIsSelecting(true);
  };

  useEffect(() => {
    if (!isSelecting) return;
    const handleMove = (event) => {
      const start = selectionStartRef.current;
      const point = getRelativePoint(event.clientX, event.clientY);
      if (!start || !point) return;
      const left = Math.min(start.x, point.x);
      const top = Math.min(start.y, point.y);
      const w = Math.abs(point.x - start.x);
      const h = Math.abs(point.y - start.y);
      setCaptureBox({ x: left, y: top, w, h });
    };
    const handleUp = () => {
      selectionStartRef.current = null;
      setIsSelecting(false);
      setCaptureBox((box) => {
        if (!box || box.w < MIN_CAPTURE || box.h < MIN_CAPTURE) return null;
        return box;
      });
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isSelecting]);

  const normalizeBox = (box) => ({
    x: Math.round(box.x * 10) / 10,
    y: Math.round(box.y * 10) / 10,
    w: Math.round(box.w * 10) / 10,
    h: Math.round(box.h * 10) / 10,
  });

  const formatBox = (box) =>
    `x:${box.x.toFixed(1)}% y:${box.y.toFixed(1)}% w:${box.w.toFixed(1)}% h:${box.h.toFixed(1)}%`;

  const addCustomItem = () => {
    if (!captureBox || captureBox.w < MIN_CAPTURE || captureBox.h < MIN_CAPTURE) return;
    const detail = customNote.trim();
    const normalized = normalizeBox(captureBox);
    setCustomItems((items) => [
      ...items,
      {
        id: `custom-${Date.now()}`,
        box: normalized,
        detail,
        flagged: false,
      },
    ]);
    setCaptureBox(null);
    setCustomNote('');
  };

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

  const manualFlagged = useMemo(() => {
    const base = CHECK_ITEMS.filter((c) => checks[c.id]).length;
    const extra = customItems.filter((c) => c.flagged).length;
    return base + extra;
  }, [checks, customItems]);
  const manualTotal = CHECK_ITEMS.length + customItems.length;
  const canAddCustom = Boolean(captureBox && captureBox.w >= MIN_CAPTURE && captureBox.h >= MIN_CAPTURE);

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

          <div className="mvp-brief">
            <div className="brief-label">案件概要</div>
            <div className="brief-title">名誉棄損・誹謗中傷の投稿スクリーンショット</div>
            <p className="brief-desc">
              依頼者が提出したスクリーンショットに対して、投稿日時や返信先の欠落、
              トリミング痕跡の有無を優先度高く確認するケースを想定しています。
            </p>
            <div className="brief-tags">
              <span>争点: 表示欠落</span>
              <span>媒体: SNS投稿</span>
              <span>目的: 追加確認の優先順位付け</span>
            </div>
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
                {customItems.map((c) => (
                  <li
                    key={c.id}
                    className={`check-item check-item-custom ${c.flagged ? 'flagged' : ''}`}
                    onClick={() => toggleCustom(c.id)}
                  >
                    <span className="check-box" aria-hidden>
                      {c.flagged ? '!' : ''}
                    </span>
                    <div className="check-body">
                      <div className="check-label">
                        画面キャプチャ
                        <span className="check-tag">任意</span>
                      </div>
                      <div className="check-capture">
                        <div className="capture-mini">
                          <div
                            className="capture-mini-box"
                            style={{
                              left: `${c.box.x}%`,
                              top: `${c.box.y}%`,
                              width: `${c.box.w}%`,
                              height: `${c.box.h}%`,
                            }}
                          />
                        </div>
                        <div className="capture-meta">{formatBox(c.box)}</div>
                      </div>
                      <div className="check-detail">{c.detail || '補足なし'}</div>
                    </div>
                    <button
                      type="button"
                      className="check-remove"
                      aria-label="任意チェックを削除"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustom(c.id);
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>

              <div className="manual-flex">
                <div className="manual-add">
                  <div className="manual-add-title">任意チェックを追加</div>
                  <div className="form-group compact">
                    <label>観点（画面キャプチャ）</label>
                    <div className={`capture-select ${canAddCustom ? 'ready' : ''}`}>
                      {captureBox ? (
                        <div className="capture-mini">
                          <div
                            className="capture-mini-box"
                            style={{
                              left: `${captureBox.x}%`,
                              top: `${captureBox.y}%`,
                              width: `${captureBox.w}%`,
                              height: `${captureBox.h}%`,
                            }}
                          />
                        </div>
                      ) : (
                        <div className="capture-placeholder">
                          中央のスクショ上をドラッグして範囲指定
                        </div>
                      )}
                    </div>
                    {captureBox && (
                      <div className="capture-meta">
                        {formatBox(captureBox)} / ドラッグで再指定
                      </div>
                    )}
                  </div>
                  <div className="form-group compact">
                    <label htmlFor="custom-note">補足（言葉の説明）</label>
                    <textarea
                      id="custom-note"
                      rows={3}
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder="例: 投稿文と文脈が一致しない"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={addCustomItem}
                    disabled={!canAddCustom}
                  >
                    任意チェックを追加
                  </button>
                </div>

                <div className="manual-notes">
                  <div className="manual-add-title">自由記述メモ</div>
                  <div className="form-group compact">
                    <label htmlFor="manual-notes">観察メモ</label>
                    <textarea
                      id="manual-notes"
                      rows={4}
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      placeholder="業務上気になる点や未整理の観察をメモ"
                    />
                  </div>
                </div>
              </div>

              <div className="manual-summary">
                <div>
                  <span className="ms-key">違和感あり</span>
                  <span className={`ms-val ${manualFlagged > 0 ? 'warn' : ''}`}>{manualFlagged} / {manualTotal}</span>
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

              <div
                ref={shotRef}
                className={`shot-frame ${aiStarted && !aiDone ? 'scanning' : ''} ${aiDone ? 'analyzed' : ''}`}
              >
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
                </div>
                <div
                  className={`shot-capture-layer ${isSelecting ? 'selecting' : ''}`}
                  onMouseDown={startCapture}
                >
                  {captureBox && (
                    <div
                      className="capture-rect"
                      style={{
                        left: `${captureBox.x}%`,
                        top: `${captureBox.y}%`,
                        width: `${captureBox.w}%`,
                        height: `${captureBox.h}%`,
                      }}
                    >
                      <span className="capture-label">任意キャプチャ</span>
                    </div>
                  )}
                </div>
                {customItems.length > 0 && (
                  <div className="shot-customs">
                    {customItems.map((c, i) => (
                      <div
                        key={c.id}
                        className="det-box det-custom"
                        style={{
                          left: `${c.box.x}%`,
                          top: `${c.box.y}%`,
                          width: `${c.box.w}%`,
                          height: `${c.box.h}%`,
                        }}
                      >
                        <span className="det-label">任意 {i + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
                {aiDone && (
                  <div className="shot-detections">
                    {AI_FINDINGS.map((f) => (
                      <div
                        key={f.id}
                        className={`det-box det-${f.tone}`}
                        style={{
                          left: `${f.box.x}%`,
                          top: `${f.box.y}%`,
                          width: `${f.box.w}%`,
                          height: `${f.box.h}%`,
                        }}
                      >
                        <span className="det-label">{f.caption}</span>
                      </div>
                    ))}
                  </div>
                )}
                {aiStarted && !aiDone && <div className="shot-scan" />}
                {aiStarted && <div className="shot-grid" />}
              </div>

              <div className="mvp-actions">
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

              <div className="mvp-actions ai-actions">
                {!aiStarted && (
                  <button className="btn btn-primary" onClick={startAi}>
                    AI判定を開始 <span className="arrow">→</span>
                  </button>
                )}
                {aiStarted && (
                  <button className="btn" onClick={resetAi}>
                    最初からやり直す
                  </button>
                )}
                <span className="mvp-actions-hint">外部送信なし / ローカル試作</span>
              </div>

              {!aiStarted && (
                <div className="ai-idle">
                  このパネルの「AI判定を開始」ボタンから実行してください。<br />
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
