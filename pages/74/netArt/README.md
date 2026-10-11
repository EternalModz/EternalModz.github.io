# Credits

## Image credits

This artwork uses remote photographic images from Unsplash. Each source below was surfaced as free to use under the Unsplash License at the time this build was assembled.

- Empty parking garage - Diego Marin: https://unsplash.com/photos/an-empty-parking-garage-with-checkered-walls-and-doors-xHXaGuSwGE4
- Dark abandoned hallway - Cosmin Andrei Buzamat: https://unsplash.com/photos/dark-hallway-with-light-at-the-end-QgvYMhXDykE
- Industrial infrastructure / pipes - Maja Guseva: https://unsplash.com/photos/underneath-a-complex-industrial-bridge-structure-with-pipes-eKerD0Nn0pA
- Underground concrete stairwell: https://unsplash.com/photos/a-set-of-stairs-leading-up-to-a-window-IVgWh0Qwk08
- Empty hospital hallway - Eric Stoynov: https://unsplash.com/photos/empty-hospital-hallway-with-fluorescent-lighting-VbvYri1h0I8
- Empty subway corridor - Jason Leung: https://unsplash.com/photos/empty-subway-station-hallway-with-tiled-walls-and-fluorescent-lights-Yj0zZ5s6fAY

Unsplash License: https://unsplash.com/license

## Audio and sound design

- All ambient sound, electronic interference, machinery, impacts, footsteps, whispers, carrier tones, glitches, spatial effects, and other non-voice sound effects used by the submitted build are generated procedurally in the browser.
- Audio synthesis and processing use the standard Web Audio API, including oscillators, generated noise buffers, filters, gain nodes, convolution, stereo positioning, and spatial PannerNode processing.
- No third-party audio files, music tracks, sample packs, or externally hosted sound recordings are included in the submitted build.
- Web Audio API documentation: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

## Assistant voice

- The assistant uses the browser and operating system Speech Synthesis voice set through the Web Speech API.
- The artwork prefers higher-quality English voices whose installed names include terms such as Natural, Aria, Jenny, Ava, Sonia, Samantha, Google English, or Microsoft English when available.
- Exact voice availability and timbre vary by browser, operating system, and device.
- No third-party voice recording or externally hosted text-to-speech audio is bundled with the artwork.
- All spoken assistant lines also remain visible in the assistance rail or subtitle layer.
- Web Speech API documentation: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

## Live data

- Live exterior weather, when the visitor grants browser location permission, is provided through the Open-Meteo current weather API.
- Browser geolocation is used only to obtain the coordinates needed for the weather request.
- Coordinates are handled client-side for the request and are not intentionally displayed or stored by this artwork.
- If location permission is denied, unavailable, or the weather request fails, the artwork falls back to fictional facility telemetry.
- Open-Meteo: https://open-meteo.com/
- Open-Meteo API documentation: https://open-meteo.com/en/docs

## Browser features and interaction

The artwork uses standard browser capabilities as part of the net art experience.

- Pointer Lock API is used during selected mouse resistance and cursor takeover sequences. The browser retains its normal escape behavior.
- Page Visibility API is used to detect when the artwork's tab becomes hidden or visible so the experience can react to the visitor leaving and returning.
- Browser local storage is used to preserve limited story and session state between pages.
- Standard pointer, mouse, keyboard, timing, animation, and document APIs are used for interaction and scene sequencing.
- Browser geolocation is permission-based and is used only for optional live weather integration.

Pointer Lock API:
https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API

Page Visibility API:
https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API

Geolocation API:
https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API

## Project content

- Interface design, narrative structure, fictional facility data, system logs, assistant dialogue, visual effects, interaction design, procedural audio behavior, and horror sequences were created specifically for this net art project.
- The facility, Continuity Program, CAS-7 assistant, Camera 18 incident, PRESERVE OCCUPANCY directive, Recovery Mode, population records, system logs, and related narrative material are fictional.
- No external JavaScript frameworks, icon libraries, font packages, music libraries, or third-party runtime dependencies are included in the submitted build.