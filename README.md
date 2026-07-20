# ii500 Report PWA

Client-side TypeScript application for creating compressed-air leak reports from
Fluke ii500 JPG screenshots. Images are processed locally in a Web Worker and
are never uploaded by the application.

## Behavior fixed by specification

- Every photograph is an independent report item.
- Photographs are never grouped or merged.
- Raw camera source dB is used without distance normalization.
- Original extracted values and manual corrections are stored separately.
- Reports are printed from the browser or saved as PDF.

## Development

```bash
npm install
npm run dev
```

Production build and checks:

```bash
npm test
npm run lint
npm run build
npm run preview
```

On Windows with Node.js installed, `Uruchom_lokalnie.bat` performs the install,
builds the app, starts a local server and opens the browser automatically.

The production output is a static PWA in `dist/`. It can be hosted on any HTTPS
static host or internal web server. No backend is required.

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Extract this package and upload all of its contents to the repository root.
   The `.github` directory must be included.
3. Open the repository's **Settings > Pages** page.
4. Under **Build and deployment**, select **GitHub Actions** as the source.
5. Open the **Actions** tab and wait for the `Deploy PWA to GitHub Pages`
   workflow to finish.
6. The public address will be shown in the completed deployment and on the
   repository's Pages settings page. It normally has this form:
   `https://YOUR-NAME.github.io/REPOSITORY-NAME/`.

Every push to the `main` branch automatically tests, builds and republishes the
application. GitHub Pages provides HTTPS, which is required for installation
and offline PWA behavior.

## Project persistence

Projects autosave to IndexedDB in the current browser profile. Use **Eksportuj
projekt** to create a durable `.ii500.zip` archive containing the project
manifest and original images. Browser storage is not a backup.

## Supported input profile

The extraction profile targets the Polish 1280 × 800 Fluke ii500 screen layout
represented by the original nine sample images. A firmware, language, font or
layout change may require updated crop coordinates or glyph templates.
