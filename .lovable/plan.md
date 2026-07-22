Eliminar todo el sonido de la página (música de intro y click sound global).

Cambios:
1. `src/lib/sound.ts`: Convertir todas las funciones generadoras de audio en no-ops (`playClick`, `startInstitutionalMusic`, `setMusicVolume`, `stopMusic`, `isMusicPlaying`, `installGlobalClickSound`) para garantizar que ninguna llamada residual produzca sonido.
2. `src/routes/__root.tsx`: Quitar el import de `installGlobalClickSound` y el `useEffect` que lo instala.
3. `src/components/Intro.tsx`: Quitar el import de `sound.ts`, los estados `muted`/`needsUnlock`, el efecto que inicia la música, la función `stopAudio`, y los botones de "Música" / "Activar música". La intro visual sigue funcionando igual, pero en silencio absoluto.

Verificación: build check y confirmación visual de que los botones de sonido desaparecen y no se reproduce ningún audio.