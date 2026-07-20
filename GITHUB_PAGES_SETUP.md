# Publish this app with GitHub Pages

## First upload

1. Sign in to GitHub and select **New repository**.
2. Enter a repository name, for example `ii500-report`.
3. Choose **Private** or **Public**, then select **Create repository**.
4. Extract the downloaded ZIP on your computer.
5. On the empty repository page, select **uploading an existing file**.
6. Drag all extracted files and directories into the upload area. Make sure the
   `.github` directory is included.
7. Select **Commit changes**.

## Enable the public test site

1. Open **Settings > Pages** in the repository.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. Open the repository's **Actions** tab.
4. Select **Deploy PWA to GitHub Pages** and wait for both jobs to turn green.
5. Open **Settings > Pages** again and follow the displayed site address.

The address will usually be:

`https://YOUR-GITHUB-NAME.github.io/REPOSITORY-NAME/`

## Updating the app

Upload the changed files and commit them. The workflow automatically runs the
tests, builds the application and updates the Pages site.

## If the workflow does not start

- Confirm that `.github/workflows/deploy-pages.yml` exists in the repository.
- Confirm that the default branch is named `main` or `master`.
- In **Settings > Actions > General**, allow GitHub Actions for the repository.
- In **Settings > Pages**, make sure the source is **GitHub Actions**.

No API keys, database or server configuration are required. Imported images
and reports remain inside the user's browser unless they explicitly export a
project archive.
