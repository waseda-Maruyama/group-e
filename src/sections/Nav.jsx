// src/sections/Nav.jsx
import React from 'react';

export default function Nav() {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href="#top" className="brand">
          <div className="brand-mark" />
          <div className="brand-name">AI生成真贋 Pro<em>/ Veritas Engine</em></div>
        </a>
        <div className="nav-links">
          <a href="#problem">課題</a>
          <a href="#product">プロダクト</a>
          <a href="#pipeline">技術</a>
          <a href="#market">市場</a>
          <a href="#team">チーム</a>
          <a href="#mvp">MVPデモ</a>
        </div>
        <a href="#cta" className="btn btn-primary">資料請求 <span className="arrow">→</span></a>
      </div>
    </nav>
  );
}
