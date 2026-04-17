import { Input, ALL_FORMATS, UrlSource } from "mediabunny";

/**
 * Retourne la durée en secondes d'un fichier audio accessible via une URL.
 * Fonctionne avec staticFile() de Remotion.
 */
export const getAudioDuration = async (src: string): Promise<number> => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(src, {
      getRetryDelay: () => null,
    }),
  });
  return input.computeDuration();
};
