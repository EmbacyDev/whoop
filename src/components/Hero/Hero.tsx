import heroBg from '../../assets/images/hero-bg.mp4';
import iphone from '../../assets/images/iphone.png';
import { useHeroPhonePullback } from '../../hooks/useHeroPhonePullback';
import { PhoneHomeUI } from './PhoneHomeUI/PhoneHomeUI';
import { ScrollIndicator } from './ScrollIndicator/ScrollIndicator';
import styles from './Hero.module.css';

type HeroProps = {
  /** True once the intro video has finished — fades the title/indicator in. */
  revealed: boolean;
};

/**
 * Hero + Figma Scroll 1→6 camera pull-back.
 *
 * Layer order (same phone coordinate space):
 *   phoneScreen (video, GSAP full-bleed) → PhoneHomeUI (phone-local) → iphone.png chrome.
 * Scroll 1: phoneScreen is viewport-sized in phone-local coords while chrome is
 * hidden. Later the phone shrinks over that same crop — a window into Scroll 1
 * framing (corner trees stay), not a portrait re-cover of the 16:9 video.
 * In-phone UI is a sibling of phoneScreen so it tracks the phone frame, not the
 * full-bleed media box, and is scroll-scrubbed from the screenshot pose
 * (PHONE_UI_START / scroll-3) through peek hold (calendar morph completes).
 */
export function Hero({ revealed }: HeroProps) {
  const {
    trackRef,
    stickyRef,
    phoneRef,
    phoneChromeRef,
    scroll1ImageRef,
    phoneHomeUiRef,
    bgBeigeRef,
    bgFinalRef,
    copyIntroRef,
    scrollIndicatorRef,
    copySharpnessRef,
    copyFinalRef,
  } = useHeroPhonePullback({ enabled: revealed });

  return (
    <section
      id="hero"
      ref={trackRef}
      className={[styles.heroTrack, revealed && styles.revealed].filter(Boolean).join(' ')}
    >
      <div className={styles.heroSticky} ref={stickyRef}>
        <div className={styles.stage}>
          <div className={styles.background}>
            <div className={styles.bgBeige} ref={bgBeigeRef} aria-hidden="true" />
            <div className={styles.bgFinal} ref={bgFinalRef} aria-hidden="true" />
          </div>

          <div className={styles.phoneStage} aria-hidden="true">
            <div className={styles.phone} ref={phoneRef}>
              {/* Screen media: lives under the PNG hole; opaque so stage cream cannot show. */}
              <div className={styles.phoneScreen} ref={scroll1ImageRef}>
                <video
                  src={heroBg}
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-hidden="true"
                  draggable={false}
                />
              </div>

              {/* Figma 1301:4 → 1323:4 continuous in-phone UI (not the full-bleed media). */}
              <div className={styles.phoneHomeUiLayer}>
                <PhoneHomeUI ref={phoneHomeUiRef} />
              </div>

              {/* Frame fades in on top; display hole + Dynamic Island come from the PNG. */}
              <div className={styles.phoneChrome} ref={phoneChromeRef}>
                <img
                  className={styles.phoneDevice}
                  src={iphone}
                  alt=""
                  draggable={false}
                />
              </div>
            </div>
          </div>

          <div className={styles.copyStack}>
            <div className={styles.copyIntro} ref={copyIntroRef}>
              <h1 className={styles.title}>Whoop Your Calendar</h1>
              <ScrollIndicator
                targetId="banners"
                className={styles.indicator}
                rootRef={scrollIndicatorRef}
              />
            </div>

            <div className={styles.copySharpness} ref={copySharpnessRef}>
              <p className={styles.headingSecondary}>
                Meet Sharpness:
                <br />
                Your Cognitive Capacity Index
              </p>
            </div>

            <div className={styles.copyFinal} ref={copyFinalRef}>
              <p className={styles.headingSecondary}>
                Dynamic score that translates your daily biometrics into mental
                readiness. Know your capacity before you start your day.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
