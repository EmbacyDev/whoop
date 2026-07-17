import { useState } from 'react';
import { VideoPreloader } from './components/VideoPreloader/VideoPreloader';
import { Header } from './components/layout/Header/Header';
import { Hero } from './components/Hero/Hero';
import { Banners } from './components/Banners/Banners';
import { DailyLoop } from './components/DailyLoop/DailyLoop';
import { CTA } from './components/CTA/CTA';
import { Footer } from './components/layout/Footer/Footer';
import styles from './App.module.css';

export default function App() {
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <div id="top" className={styles.app}>
      <VideoPreloader onFinish={() => setIntroFinished(true)} />

      <Header visible={introFinished} />

      <main>
        <Hero revealed={introFinished} />
        <Banners />
        <DailyLoop />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
