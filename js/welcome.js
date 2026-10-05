/**
 * Welcome Screen Controller
 * Handles welcome screen lifecycle, background video playback, soundtrack audio controls,
 * and ENTER button triggers.
 */
export class WelcomeScreen {
  constructor({ onEnter, audio }) {
    this.onEnter = onEnter;
    this.audio = audio;

    this.container = document.getElementById('welcome-screen');
    this.enterButton = document.getElementById('enter-button');
    this.welcomeTitle = document.getElementById('welcome-title');
    this.bgVideo = document.getElementById('bg-video');
    this.audioToggleBtn = document.getElementById('audio-toggle');
    this.audioToggleText = document.getElementById('audio-toggle-text');

    this.isTransitioning = false;
    this.isSoundActive = false;
  }

  /**
   * Initializes event listeners and video autoplay
   */
  init() {
    if (!this.container || !this.enterButton) return;

    // Ensure data-text is set on title for RGB split pseudo-elements
    if (this.welcomeTitle) {
      this.welcomeTitle.setAttribute('data-text', this.welcomeTitle.textContent.trim());
    }

    // Attempt video autoplay with graceful fallback
    this.initVideo();

    // Trigger initial page load entrance animation
    requestAnimationFrame(() => {
      setTimeout(() => {
        this.container.classList.add('is-loaded');
      }, 100);
    });

    // Enter button interactions
    this.enterButton.addEventListener('mouseenter', () => this.handleHover());
    this.enterButton.addEventListener('click', (e) => this.handleClick(e));

    // Soundtrack audio toggle button (Mute / Play)
    if (this.audioToggleBtn) {
      this.audioToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSound();
      });
    }
  }

  /**
   * Robust video autoplay handling (starts muted for cross-browser autoplay compliance)
   */
  initVideo() {
    if (!this.bgVideo) return;

    this.bgVideo.muted = true;
    this.bgVideo.playsInline = true;
    this.bgVideo.loop = true;

    const playPromise = this.bgVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn('Autoplay prevented or pending user interaction:', error);
        // Autoplay on first user interaction as fallback
        const resumePlayback = () => {
          this.bgVideo.play();
          window.removeEventListener('click', resumePlayback);
          window.removeEventListener('touchstart', resumePlayback);
        };
        window.addEventListener('click', resumePlayback, { once: true });
        window.addEventListener('touchstart', resumePlayback, { once: true });
      });
    }
  }

  /**
   * Toggles video soundtrack audio between Muted and Playing
   */
  toggleSound() {
    if (this.isTransitioning) return;

    if (this.isSoundActive) {
      this.muteVideoSound();
    } else {
      this.unmuteVideoSound();
    }
  }

  /**
   * Unmutes and plays the background video song/audio
   */
  unmuteVideoSound() {
    this.isSoundActive = true;

    if (this.bgVideo) {
      this.bgVideo.muted = false;
      this.bgVideo.volume = 1.0;
      this.bgVideo.play().catch(() => {});
    }

    if (this.audioToggleBtn) {
      this.audioToggleBtn.classList.add('is-active');
    }
    if (this.audioToggleText) {
      this.audioToggleText.textContent = 'SOUND // ON';
    }

    // Unlock Web Audio API context alongside video soundtrack
    if (this.audio) {
      this.audio.init();
      this.audio.resume();
      this.audio.playHover();
    }
  }

  /**
   * Mutes the background video song/audio
   */
  muteVideoSound() {
    this.isSoundActive = false;

    if (this.bgVideo) {
      this.bgVideo.muted = true;
    }

    if (this.audioToggleBtn) {
      this.audioToggleBtn.classList.remove('is-active');
    }
    if (this.audioToggleText) {
      this.audioToggleText.textContent = 'SOUND // OFF';
    }
  }

  /**
   * Stops and silences the background video soundtrack immediately upon ENTER click
   */
  stopVideoSound() {
    this.isSoundActive = false;

    if (this.audioToggleBtn) {
      this.audioToggleBtn.classList.remove('is-active');
    }
    if (this.audioToggleText) {
      this.audioToggleText.textContent = 'SOUND // OFF';
    }

    if (this.bgVideo) {
      // Rapid audio fade-out so there is no audio pop
      let currentVol = this.bgVideo.volume;
      const step = currentVol / 6;
      const fadeTimer = setInterval(() => {
        currentVol -= step;
        if (currentVol <= 0.05 || isNaN(currentVol)) {
          clearInterval(fadeTimer);
          this.bgVideo.volume = 0;
          this.bgVideo.muted = true;
          this.bgVideo.pause();
        } else {
          this.bgVideo.volume = Math.max(0, currentVol);
        }
      }, 25);
    }
  }

  /**
   * Handles button hover effect & sound
   */
  handleHover() {
    if (this.isTransitioning) return;
    if (this.audio) {
      this.audio.playHover();
    }
  }

  /**
   * Handles button click & triggers cinematic transition
   */
  handleClick(e) {
    e.preventDefault();
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Immediately stop the background video song
    this.stopVideoSound();

    // Initialize procedural transition audio
    if (this.audio) {
      this.audio.init();
      this.audio.resume();
    }

    if (typeof this.onEnter === 'function') {
      this.onEnter();
    }
  }

  /**
   * Resets the welcome screen for replay testing
   */
  reset() {
    this.isTransitioning = false;
    this.container.classList.remove('is-hidden', 'transition-brightening');
    this.welcomeTitle.classList.remove('is-distorting');
    this.enterButton.classList.remove('is-engaged');
    this.container.classList.add('is-loaded');

    if (this.bgVideo) {
      this.bgVideo.currentTime = 0;
      this.bgVideo.volume = 1.0;
      this.bgVideo.muted = true;
      this.bgVideo.play().catch(() => {});
    }

    this.isSoundActive = false;
    if (this.audioToggleBtn) {
      this.audioToggleBtn.classList.remove('is-active');
    }
    if (this.audioToggleText) {
      this.audioToggleText.textContent = 'SOUND // OFF';
    }
  }

  /**
   * Hides the welcome screen completely
   */
  hide() {
    this.container.classList.add('is-hidden');
  }
}
