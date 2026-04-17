import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";

import { IntroScene } from "./scenes/IntroScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { OverviewScene } from "./scenes/OverviewScene";
import { HabitTrackerScene } from "./scenes/HabitTrackerScene";
import { GoalsScene } from "./scenes/GoalsScene";
import { NotificationsScene } from "./scenes/NotificationsScene";
import { SocialScene } from "./scenes/SocialScene";
import { StatsScene } from "./scenes/StatsScene";
import { ProfileScene } from "./scenes/ProfileScene";
import { OutroScene } from "./scenes/OutroScene";

export type KarismaProps = {
  /** Durée de chaque scène en frames, calculée depuis la durée des MP3 */
  sceneDurations: number[];
};

const TRANSITION_FRAMES = 20;

/** Fichiers audio dans public/voiceover/ */
const AUDIO_FILES = [
  "voiceover/01-intro.mp3",
  "voiceover/02-problem.mp3",
  "voiceover/03-overview.mp3",
  "voiceover/04-habits.mp3",
  "voiceover/05-goals.mp3",
  "voiceover/06-notifications.mp3",
  "voiceover/07-social.mp3",
  "voiceover/08-stats.mp3",
  "voiceover/09-profile.mp3",
  "voiceover/10-outro.mp3",
] as const;

const SCENES = [
  IntroScene,
  ProblemScene,
  OverviewScene,
  HabitTrackerScene,
  GoalsScene,
  NotificationsScene,
  SocialScene,
  StatsScene,
  ProfileScene,
  OutroScene,
] as const;

// Transitions alternées pour du rythme
const TRANSITIONS = [
  <TransitionSeries.Transition key="t0" presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />,
  <TransitionSeries.Transition key="t1" presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />,
  <TransitionSeries.Transition key="t2" presentation={wipe({ direction: "from-left" })} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />,
  <TransitionSeries.Transition key="t3" presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />,
  <TransitionSeries.Transition key="t4" presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />,
  <TransitionSeries.Transition key="t5" presentation={wipe({ direction: "from-right" })} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />,
  <TransitionSeries.Transition key="t6" presentation={slide({ direction: "from-left" })} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />,
  <TransitionSeries.Transition key="t7" presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />,
  <TransitionSeries.Transition key="t8" presentation={wipe({ direction: "from-left" })} timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })} />,
];

/**
 * Calcule le frame de début absolu de chaque scène dans la timeline,
 * en tenant compte des chevauchements des transitions.
 */
function computeOffsets(durations: number[]): number[] {
  const offsets: number[] = [0];
  for (let i = 1; i < durations.length; i++) {
    offsets.push(offsets[i - 1] + durations[i - 1] - TRANSITION_FRAMES);
  }
  return offsets;
}

export const KarismaPresentation: React.FC<KarismaProps> = ({ sceneDurations }) => {
  const durations =
    sceneDurations?.length === 10
      ? sceneDurations
      : [135, 120, 135, 150, 135, 120, 150, 135, 120, 150];

  const offsets = computeOffsets(durations);

  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>

      {/* ── Piste audio : une <Audio> par scène dans sa propre <Sequence> ────── */}
      {(AUDIO_FILES as unknown as string[]).map((file, i) => (
        <Sequence
          key={`audio-${i}`}
          from={offsets[i]}
          durationInFrames={durations[i]}
          layout="none"
        >
          <Audio src={staticFile(file)} volume={1} />
        </Sequence>
      ))}

      {/* ── Piste vidéo : 10 scènes enchaînées avec transitions ─────────────── */}
      <TransitionSeries>
        {SCENES.map((SceneComponent, i) => (
          <React.Fragment key={`scene-${i}`}>
            <TransitionSeries.Sequence durationInFrames={durations[i]}>
              <SceneComponent />
            </TransitionSeries.Sequence>
            {i < SCENES.length - 1 && TRANSITIONS[i]}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
