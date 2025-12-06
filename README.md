# Flappy Fart-eev

## About the Game

**Flappy Fart-eev** is a modern, humorous take on the classic side-scrolling "flappy" game genre. Instead of wings, our hero uses powerful farts to navigate a treacherous world of glossy green pipes. The game features polished graphics, smooth animations, a persistent scoring system, and a unique character customization feature that lets you play as anyone (or anything) you want!

Built with pure HTML, CSS, and JavaScript, this game is designed to be lightweight, cross-platform, and easily customizable.

## How to Play

The controls are simple:
- **Click** your mouse, **tap** your screen, or press the **Spacebar**.
- Each press makes your character fart, propelling them upwards.
- Gravity will constantly pull your character down.
- Navigate through the gaps in the pipes to score points.
- Hitting a pipe or the ground will end the game.

Your goal is to get the highest score possible. Your best score is saved automatically in your browser!

---

## For Users

The game features a fixed character design. No character customization is available.

---

## For Developers

This project is built without any external frameworks, making it easy to understand and modify.

### How Assets Work

-   `index.html`: The main structure of the game, including the canvas and UI popups.
-   `style.css`: Contains all visual styling, from the parallax background to button designs and popup animations.
-   `game.js`: The core game logic. It handles physics, rendering, state management, scoring, and event handling.
-   `/assets`:
-   `mycharacter.jpg`: The default character image.
    -   `fart.mp3`: The sound played when the character jumps.
    -   `hit.wav`: The sound played on collision.
    -   `ground.svg`: The ground texture used in the parallax background.

### How the Base64 Character Storage Works

To persist the custom character across game sessions without a server, we use the browser's `localStorage`.

1.  **Upload**: When a user selects a file, the `game.js` script uses the `FileReader` API to read the local image file.
2.  **Conversion**: The `FileReader` converts the image into a **Base64-encoded Data URL** (a long string of text that represents the image data).
3.  **Storage**: This Base64 string is then saved into `localStorage` under the key `playerCharacter`.
4.  **Loading**: When the game starts, it checks if `localStorage.getItem('playerCharacter')` exists.
    -   If it does, the game sets the player image's source directly to this Base64 string. The browser can render this string just like a normal image URL.
    -   If it doesn't, the game loads the default `assets/mycharacter.png` file.
5.  **Reset**: The "Reset" button simply calls `localStorage.removeItem('playerCharacter')`, causing the game to fall back to the default image on the next load.

---

## GitHub Pages Deployment

You can host and share your own version of this game for free using GitHub Pages.

### 1. Create a GitHub Repository

-   Go to [GitHub](https://github.com) and create a new public repository. Let's name it `Flappy-Fart-eev`.

### 2. Add Your Project Files

-   Upload the `index.html`, `style.css`, `game.js`, `README.md`, and the entire `assets` folder to your new repository. You can do this via the "Add file" -> "Upload files" button or by using Git commands (`git init`, `git add .`, `git commit`, `git push`).

### 3. Enable GitHub Pages

-   In your repository, go to the **"Settings"** tab.
-   In the left sidebar, click on **"Pages"**.
-   Under the "Build and deployment" section, select the **Source** as **"Deploy from a branch"**.
-   Choose the branch your code is on (usually `main` or `master`).
-   Leave the folder as `/ (root)`.
-   Click **"Save"**.

### 4. Access and Share Your Game!

-   After a minute or two, GitHub will publish your site.
-   The live URL will be displayed on the same "Pages" settings screen. It will look like this:
    ```
    https://<your-username>.github.io/Flappy-Fart-eev/
    ```
-   You can now share this link with your friends so they can play your game!
