# Cryptography, visually

Five lessons with interactive animations, live experiments, theory, prediction questions and runnable JavaScript examples:

1. Symmetric encryption: AES-GCM
2. Public key encryption: RSA-OAEP
3. Hashing: SHA-256, with SHA-1 and SHA-512 comparisons
4. Signatures: ECDSA P-256
5. Certificates: a simplified signed-record model

## Run locally

Requires a current Node.js version. Tests use Node 24's built-in TypeScript support.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5187
```

Open http://127.0.0.1:5187. The lesson workspace appears immediately, with four visible activity tabs: Animation, Theory, Try it and Code. Use the sidebar to choose lessons, or the Previous lesson and Next lesson arrows. On smaller screens, Open lessons opens the learning path.

Animations are silent and start automatically. Scenes advance on their own and loop back to the first scene at the end of the lesson. Use Pause to read or edit the live inputs, then Resume to continue. Choosing another scene keeps your manual pause. Opening a new lesson starts it automatically. Next scene moves forward. Space toggles playback when the player has focus, and left/right arrows select scenes. The scene progress slider can be used with a pointer or keyboard.

Use Try it to make a prediction, then check the result. In Code, change the input and press Run example. The displayed JavaScript is the exact fixed example that runs, with the input passed as a parameter. Copy snippets into an async function to run them elsewhere. Course guide opens the comparison, TLS overview, quiz and FAQ.

The supplied `logo.png` is used in the sidebar and as the site icon.

Use the moon or sun button in the header to switch between light and dark mode. Your choice is saved locally. On first use, the site follows your device theme.

Lesson, scene, activity and course guide changes use browser history. The mouse Back and Forward buttons return through those views. The current URL can be shared or refreshed to reopen the same lesson and scene. Automatic scene playback updates the current history entry. Once you reach the first view in this visit, Back follows normal browser behavior and leaves the site.

## Check

```sh
npm run check
npm test
npm run build
```

Build output is `dist/index.html`, with application JavaScript and CSS inlined. Google Fonts are optional external resources. Serve on localhost or HTTPS for Web Crypto. There is no simulated cryptography fallback.

## Learning boundaries

This is a foundation course, not a complete cryptography course or production security library. The certificate lesson does not implement X.509, live certificate issuance, chain building or live revocation. Its revocation switch models that policy decision. The RSA encryption demo is not modern TLS key agreement. The XOR scene demonstrates an unauthenticated cipher, not AES-GCM.

All animation values use real Web Crypto except the deliberately simple XOR illustration and the certificate model's name/date/revocation rules. Values and keys are visible for teaching. Do not use demo keys for real data. Local storage saves lesson progress on this browser.

Reference links are included in each lesson's Theory section. Further lessons could cover MACs, key agreement, key derivation, password hashing and secure firmware updates.
