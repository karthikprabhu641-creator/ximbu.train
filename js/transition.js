/**
 * Cinematic Digital Transition Engine
 * Executes an orchestrated 8-step transition sequence between the Welcome Screen
 * and the Main World / Scene.
 */
export class CinematicTransition {
  constructor({ audio }) {
    this.audio = audio;
    this.welcomeScreen = document.getElementById('welcome-screen');
    this.welcomeTitle = document.getElementById('welcome-title');
    this.enterButton = document.getElementById('enter-button');
    this.wireLayer = document.getElementById('wire-lines-layer');
    this.glitchLayer = document.getElementById('glitch-fragments-layer');
    this.flashOverlay = document.getElementById('flash-overlay');

    this.isRunning = false;
  }

  /**
   * Starts the cinematic sequence
   * @param {Function} onComplete - Callback executed when transition finishes
   */
  start(onComplete) {
    if (this.isRunning) return;
    this.isRunning = true;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Trigger procedural transition audio
    if (this.audio) {
      this.audio.playTransition();
    }

    if (prefersReducedMotion) {
      // Elegant reduced-motion fade transition
      this.executeReducedMotionSequence(onComplete);
      return;
    }

    this.executeFullCinematicSequence(onComplete);
  }

  /**
   * Full cinematic 8-stage sequence (~1.95s total duration)
   */
  executeFullCinematicSequence(onComplete) {
    // Step 1: ENTER button reacts to click (t = 0ms)
    this.enterButton.classList.add('is-engaged');

    // Step 2 & 3: WELCOME text begins to distort + Subtle RGB split appears (t = 250ms)
    setTimeout(() => {
      this.welcomeTitle.classList.add('is-distorting');
    }, 220);

    // Step 4: Thin digital wire lines emerge (t = 420ms)
    setTimeout(() => {
      if (this.wireLayer) {
        this.wireLayer.classList.add('is-active');
      }
    }, 420);

    // Step 5: Glitch fragments briefly appear (t = 650ms)
    setTimeout(() => {
      if (this.glitchLayer) {
        this.glitchLayer.classList.add('is-active');
      }
    }, 650);

    // Step 6: Screen brightness increases (t = 950ms)
    setTimeout(() => {
      this.welcomeScreen.classList.add('transition-brightening');
    }, 950);

    // Step 7: Short white/blue flash (t = 1350ms)
    setTimeout(() => {
      if (this.flashOverlay) {
        this.flashOverlay.classList.add('is-flashing');
      }
    }, 1350);

    // Step 8: Screen transitions into the main scene (t = 1680ms)
    setTimeout(() => {
      if (typeof onComplete === 'function') {
        onComplete();
      }

      // Cleanup transition states after flash dissolves (t = 2050ms)
      setTimeout(() => {
        this.cleanup();
      }, 370);
    }, 1680);
  }

  /**
   * Accessible transition for users with reduced motion preferences
   */
  executeReducedMotionSequence(onComplete) {
    this.enterButton.classList.add('is-engaged');
    this.welcomeScreen.style.transition = 'opacity 0.6s ease';
    this.welcomeScreen.style.opacity = '0';

    setTimeout(() => {
      if (typeof onComplete === 'function') {
        onComplete();
      }
      this.welcomeScreen.style.opacity = '';
      this.welcomeScreen.style.transition = '';
      this.cleanup();
    }, 600);
  }

  /**
   * Resets transition DOM state classes
   */
  cleanup() {
    this.isRunning = false;
    if (this.wireLayer) this.wireLayer.classList.remove('is-active');
    if (this.glitchLayer) this.glitchLayer.classList.remove('is-active');
    if (this.flashOverlay) this.flashOverlay.classList.remove('is-flashing');
  }
}
