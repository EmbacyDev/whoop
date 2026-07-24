import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { PrismPhase } from '../../../hooks/useDailyLoopPin';
import type { DailyLoopState } from '../dailyLoopData';
import styles from './LoopCard.module.css';

type LoopCardProps = {
  states: DailyLoopState[];
  /** Continuous index for timeline / copy blend. */
  scrollIndex: number;
  /** Destination face while a step cycle is playing. */
  activeIndex: number;
  /** Prism rotateX in degrees — driven by the step cycle, not scroll scrub. */
  prismRotation: number;
  /** 1 = full-size card; lower = assembled hexagonal prism. */
  prismZoom: number;
  /** Step-cycle phase — controls which faces are visible. */
  prismPhase: PrismPhase;
  /** 1 = normal spacing; lower = tighter assembled prism. */
  prismRadiusScale: number;
  /** 0→1 — neighboring faces fade in during compress. */
  assembleProgress: number;
  /** 0→1 — non-destination faces fade out during expand (1 = front only). */
  dissolveProgress: number;
  linked?: boolean;
  axis?: ReactNode;
};

/**
 * Hexagonal prism: 60° between faces.
 * Four state cards occupy four consecutive faces.
 */
const FACE_ANGLE = 60;
const FACE_ANGLE_RAD = (FACE_ANGLE * Math.PI) / 180;

/** R = faceHeight / (2 · sin(θ/2)) — panels meet edge-to-edge. */
function radiusForFaceHeight(faceHeight: number) {
  return faceHeight / (2 * Math.sin(FACE_ANGLE_RAD / 2));
}

type LoopFaceProps = {
  state: DailyLoopState;
  isFront: boolean;
  faceStyle: CSSProperties;
};

/** Keeps background video playing only on the visible face (incl. reverse steps). */
function LoopFace({ state, isFront, faceStyle }: LoopFaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isFront) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          /* Autoplay may be blocked until the next user gesture. */
        });
      }
      return;
    }

    video.pause();
  }, [isFront, state.video]);

  return (
    <div
      className={styles.face}
      aria-hidden={!isFront}
      style={faceStyle}
    >
      <video
        ref={videoRef}
        className={styles.video}
        src={state.video}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        aria-hidden="true"
      />
      <img
        className={styles.overlay}
        src={state.overlay}
        alt={isFront ? state.imageAlt : ''}
        draggable={false}
      />
    </div>
  );
}

/**
 * Hexagonal-prism carousel.
 *
 * Each face is an independent rounded card. Zoom/rotation come from the
 * scripted step cycle (compress → rotate one face → expand) — never scrubbed.
 */
export function LoopCard({
  states,
  scrollIndex,
  activeIndex,
  prismRotation,
  prismZoom,
  prismPhase,
  prismRadiusScale,
  assembleProgress,
  dissolveProgress,
  linked = false,
  axis,
}: LoopCardProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [prismRadius, setPrismRadius] = useState(360);
  const inPrism = prismPhase === 'compress' || prismPhase === 'rotate';
  const effectiveRadius = prismRadius * prismRadiusScale;
  // At rest only the committed face is visible; during cycles use scrollIndex.
  const frontIndex =
    prismPhase === 'rest' || prismPhase === 'expand'
      ? activeIndex
      : Math.trunc(scrollIndex);

  const faceOpacity = (index: number) => {
    if (prismPhase === 'rest') {
      return index === activeIndex ? 1 : 0;
    }
    if (prismPhase === 'compress') {
      if (index === frontIndex) return 1;
      return assembleProgress;
    }
    if (prismPhase === 'rotate') {
      return 1;
    }
    // expand — dissolve neighbors; destination card stays visible
    if (index === activeIndex) return 1;
    return 1 - dissolveProgress;
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const update = () => {
      const height = stage.getBoundingClientRect().height;
      if (height > 0) setPrismRadius(radiusForFaceHeight(height));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={styles.card}
      data-linked={linked}
      data-prism={inPrism}
    >
      <div className={styles.imageStage} ref={stageRef}>
        {axis}

        {/*
          Perspective host only — no shared border-radius / overflow mask.
          Each face carries its own rounded corners at every scale.
        */}
        <div className={styles.prismSpace}>
          <div
            className={styles.prism}
            style={{
              transform: [
                `scale(${prismZoom.toFixed(4)})`,
                `translateZ(${(-effectiveRadius).toFixed(2)}px)`,
                `rotateX(${prismRotation.toFixed(3)}deg)`,
              ].join(' '),
            }}
          >
            {states.map((state, index) => {
              const opacity = faceOpacity(index);
              const isFront = opacity >= 0.99;
              const faceStyle: CSSProperties = {
                transform: [
                  `rotateX(${(-index * FACE_ANGLE).toFixed(3)}deg)`,
                  `translateZ(${effectiveRadius.toFixed(2)}px)`,
                  'scaleY(1.004)',
                ].join(' '),
                opacity,
                visibility: isFront ? 'visible' : 'hidden',
              };

              return (
                <LoopFace
                  key={state.id}
                  state={state}
                  isFront={isFront}
                  faceStyle={faceStyle}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.footerStack}>
        {states.map((state, index) => {
          const abs = Math.abs(index - scrollIndex);
          const opacity = abs >= 1 ? 0 : Math.pow(1 - abs, 1.6);
          return (
            <div
              key={state.id}
              className={styles.footer}
              style={{ opacity }}
              aria-hidden={abs >= 0.5}
            >
              <span className={styles.pill}>{state.pillLabel}</span>
              <p className={styles.description}>{state.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
