// src/App.jsx — AI生成真贋 Pro LP root component
import React, { useEffect, useState } from 'react';

import Nav from './sections/Nav.jsx';
import Hero from './sections/Hero.jsx';
import Threshold from './sections/Threshold.jsx';
import Product from './sections/Product.jsx';
import Pipeline from './sections/Pipeline.jsx';
import UseCases from './sections/UseCases.jsx';
import Market from './sections/Market.jsx';
import Moat from './sections/Moat.jsx';
import Roadmap from './sections/Roadmap.jsx';
import Team from './sections/Team.jsx';
import CTA from './sections/CTA.jsx';
import Footer from './sections/Footer.jsx';
import Mvp from './sections/Mvp.jsx';

function useHashRoute() {
  const get = () => (typeof window !== 'undefined' ? window.location.hash : '');
  const [hash, setHash] = useState(get());
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHashRoute();
  const isMvp = hash.startsWith('#mvp');

  return (
    <>
      <div className="noise" />
      <Nav />
      {isMvp ? (
        <Mvp />
      ) : (
        <>
          <Hero />
          <Threshold />
          <Product />
          <Pipeline />
          <UseCases />
          <Market />
          <Moat />
          <Roadmap />
          <Team />
          <CTA />
        </>
      )}
      <Footer />
    </>
  );
}
