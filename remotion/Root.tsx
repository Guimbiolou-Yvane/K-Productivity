import { Composition, CalculateMetadataFunction, staticFile } from "remotion";
import { KarismaPresentation, KarismaProps } from "./KarismaPresentation";
import { getAudioDuration } from "./get-audio-duration";

const FPS = 30;
const TRANSITION_FRAMES = 20; // transitions de 20f entre scènes
const NUM_TRANSITIONS = 9;    // 10 scènes = 9 transitions

/** Fichiers MP3 dans public/voiceover/ (dans l'ordre des scènes) */
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

// Durées fallback si les MP3 ne sont pas encore disponibles (2min30s = 4500f)
const FALLBACK_FRAMES = [135, 120, 135, 150, 135, 120, 150, 135, 120, 150] as const;

const calculateMetadata: CalculateMetadataFunction<KarismaProps> = async () => {
  try {
    const durations = await Promise.all(
      AUDIO_FILES.map((f) => getAudioDuration(staticFile(f)))
    );
    const sceneDurations = durations.map((s) => Math.ceil(s * FPS) + 10); // +10f de marge fin
    const totalDuration =
      sceneDurations.reduce((sum, d) => sum + d, 0) -
      NUM_TRANSITIONS * TRANSITION_FRAMES;

    console.log("Scene durations (frames):", sceneDurations);
    console.log("Total duration (frames):", totalDuration, "=", (totalDuration / FPS).toFixed(1), "s");

    return {
      durationInFrames: Math.max(totalDuration, 100),
      props: { sceneDurations } satisfies KarismaProps,
    };
  } catch (e) {
    console.warn("⚠️  calculateMetadata fallback:", e);
    return {
      durationInFrames:
        FALLBACK_FRAMES.reduce((s, d) => s + d, 0) -
        NUM_TRANSITIONS * TRANSITION_FRAMES,
      props: { sceneDurations: [...FALLBACK_FRAMES] } satisfies KarismaProps,
    };
  }
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="KarismaPresentation"
      component={KarismaPresentation}
      durationInFrames={4500} // placeholder 2min30s, overridden by calculateMetadata
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ sceneDurations: [...FALLBACK_FRAMES] } satisfies KarismaProps}
      calculateMetadata={calculateMetadata}
    />
  );
};
