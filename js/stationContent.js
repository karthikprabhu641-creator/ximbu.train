/**
 * Station Content Presentation & Spatial UI Controller (Phase 4)
 * Manages minimal, cinematic glass overlays, docked station action triggers,
 * and data-driven station content presentation without full-screen obscuration.
 */

// Data-driven station content definitions (prepares for Phase 5 content population)
export const STATION_DATA = {
  station_01: {
    id: 'station_01',
    code: 'STN-01',
    name: 'INTRODUCTION',
    category: 'Who I Am',
    tagline: 'CREATIVE DEVELOPER & DIGITAL ARCHITECT',
    summary: 'A journey through code, spatial computing, and interactive digital worlds.',
    highlights: [
      { label: 'DISCIPLINE', value: 'Creative Engineering // Real-time 3D' },
      { label: 'PHILOSOPHY', value: 'Kinetic interfaces with high visual fidelity' },
      { label: 'STATUS', value: 'Active explorer along the railway' }
    ],
    details: 'Welcome to this digital expedition. This journey chronicles the intersection of web graphics, procedural design, and modern interactive engineering.'
  },
  station_02: {
    id: 'station_02',
    code: 'STN-02',
    name: 'PROJECTS',
    category: 'Selected Works',
    tagline: 'INTERACTIVE ARCHIVES & PRODUCTION DEPLOYMENTS',
    summary: 'Curated gallery of real-time web applications, graphics engines, and responsive systems.',
    highlights: [
      { label: 'SYSTEMS', value: 'Interactive WebGL Portfolios & 3D Tools' },
      { label: 'PERFORMANCE', value: '60 FPS Framerate-optimized pipelines' },
      { label: 'STACK', value: 'Three.js • Web Audio API • Modern ES' }
    ],
    details: 'A showcase of specialized digital builds that combine artistic vision with uncompromising technical performance.'
  },
  station_03: {
    id: 'station_03',
    code: 'STN-03',
    name: 'HACKATHONS',
    category: 'Rapid Prototyping & Competitions',
    tagline: 'HIGH-INTENSITY INNOVATION CHALLENGES',
    summary: 'Sprints of rapid conception, prototyping, and podium finishes under tight constraints.',
    highlights: [
      { label: 'EXPEDITIONS', value: 'Global & Regional AI / Web3 Hackathons' },
      { label: 'FOCUS', value: 'Novel interaction models & immediate utility' },
      { label: 'RECOGNITIONS', value: 'Multiple top awards and jury honors' }
    ],
    details: 'Where speed meets precision: transforming early stage concepts into operational full-stack prototypes within 48-hour sprints.'
  },
  station_04: {
    id: 'station_04',
    code: 'STN-04',
    name: 'CERTIFICATES',
    category: 'Credentials & Specializations',
    tagline: 'CONTINUOUS MASTERY & VERIFIED ACCREDITATIONS',
    summary: 'Formal certifications in cloud infrastructure, frontend architecture, and graphic programming.',
    highlights: [
      { label: 'FOUNDATIONS', value: 'Advanced Software Engineering' },
      { label: 'SPECIALTY', value: 'WebGL • Shaders • High Performance JS' },
      { label: 'VERIFIED', value: 'Industry standard accreditations' }
    ],
    details: 'Demonstrated mastery across core distributed systems, computer graphics, and state-of-the-art web architectures.'
  },
  station_05: {
    id: 'station_05',
    code: 'STN-05',
    name: 'CONNECT',
    category: 'Contact & Digital Channels',
    tagline: 'TRANSMISSION CORRIDOR & COLLABORATIONS',
    summary: 'Direct communication relays for partnerships, opportunities, and discussions.',
    highlights: [
      { label: 'CHANNELS', value: 'GitHub • LinkedIn • Email' },
      { label: 'LOCATION', value: 'Global / Remote Availability' },
      { label: 'RESPONSE', value: 'Prompt transmission replies' }
    ],
    details: 'The end of the line is only the start of the next journey. Initiate contact to engineer memorable experiences together.'
  }
};

export class StationContentUI {
  constructor({ container, onOpen, onClose, onDepart, audio }) {
    this.container = container || document.getElementById('main-scene') || document.body;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.onDepart = onDepart;
    this.audio = audio;

    this.isOpen = false;
    this.currentStation = null;

    this.initDOM();
    this.bindEvents();
  }

  /**
   * Builds the DOM elements for docked station prompts and spatial content overlay
   */
  initDOM() {
    // 1. Docked Station HUD Indicator (Appears when train stops at platform)
    this.dockedPrompt = document.createElement('div');
    this.dockedPrompt.className = 'station-docked-prompt';
    this.dockedPrompt.innerHTML = `
      <div class="docked-prompt-inner">
        <span class="docked-beacon-dot"></span>
        <div class="docked-info">
          <div class="docked-station-tag" id="docked-station-tag">STATION DOCKED</div>
          <div class="docked-station-name" id="docked-station-name">INTRODUCTION</div>
        </div>
        <div class="docked-actions">
          <button class="station-btn station-btn-inspect" id="btn-inspect-station" type="button">
            <span>⬡ INSPECT STATION [E]</span>
          </button>
          <button class="station-btn station-btn-depart" id="btn-depart-station" type="button">
            <span>CONTINUE JOURNEY →</span>
          </button>
        </div>
      </div>
    `;
    this.container.appendChild(this.dockedPrompt);

    // 2. Spatial Content Overlay (Minimal dark glass, 3D world remains visible)
    this.contentModal = document.createElement('div');
    this.contentModal.className = 'station-content-modal';
    this.contentModal.setAttribute('role', 'dialog');
    this.contentModal.setAttribute('aria-modal', 'true');
    this.contentModal.innerHTML = `
      <div class="station-modal-backdrop" id="station-modal-backdrop"></div>
      <div class="station-modal-panel">
        <header class="modal-header">
          <div class="modal-breadcrumbs">
            <span class="modal-code" id="modal-station-code">STN-01</span>
            <span class="modal-sep">//</span>
            <span class="modal-category" id="modal-station-category">WHO I AM</span>
          </div>
          <button class="modal-close-btn" id="modal-close-btn" aria-label="Close Station Content" type="button">
            <span>✕ RETURN TO TRAIN</span>
          </button>
        </header>

        <div class="modal-body">
          <h2 class="modal-title" id="modal-station-title">INTRODUCTION</h2>
          <p class="modal-tagline" id="modal-station-tagline">CREATIVE DEVELOPER & ARCHITECT</p>

          <div class="modal-highlights" id="modal-station-highlights">
            <!-- Dynamic highlights inserted here -->
          </div>

          <div class="modal-desc" id="modal-station-desc">
            <!-- Description inserted here -->
          </div>
        </div>

        <footer class="modal-footer">
          <div class="modal-telemetry-tag">CORRIDOR 01 // PLATFORM ACCREDITATION</div>
          <div class="modal-footer-actions">
            <button class="station-btn station-btn-secondary" id="modal-btn-back" type="button">
              <span>RETURN TO TRAIN [ESC]</span>
            </button>
            <button class="station-btn station-btn-primary" id="modal-btn-depart" type="button">
              <span>CONTINUE EXPEDITION →</span>
            </button>
          </div>
        </footer>
      </div>
    `;
    this.container.appendChild(this.contentModal);

    // Cache elements
    this.dockedTag = document.getElementById('docked-station-tag');
    this.dockedName = document.getElementById('docked-station-name');
    this.btnInspect = document.getElementById('btn-inspect-station');
    this.btnDepart = document.getElementById('btn-depart-station');

    this.modalCode = document.getElementById('modal-station-code');
    this.modalCategory = document.getElementById('modal-station-category');
    this.modalTitle = document.getElementById('modal-station-title');
    this.modalTagline = document.getElementById('modal-station-tagline');
    this.modalHighlights = document.getElementById('modal-station-highlights');
    this.modalDesc = document.getElementById('modal-station-desc');

    this.modalCloseBtn = document.getElementById('modal-close-btn');
    this.modalBtnBack = document.getElementById('modal-btn-back');
    this.modalBtnDepart = document.getElementById('modal-btn-depart');
    this.modalBackdrop = document.getElementById('station-modal-backdrop');
  }

  /**
   * Binds click and keyboard interaction handlers
   */
  bindEvents() {
    // Inspect Station click
    this.btnInspect.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openCurrentStation();
    });

    // Depart click
    this.btnDepart.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerDeparture();
    });

    // Close Modal buttons
    this.modalCloseBtn.addEventListener('click', () => this.close());
    this.modalBtnBack.addEventListener('click', () => this.close());
    this.modalBackdrop.addEventListener('click', () => this.close());

    // Depart from modal
    this.modalBtnDepart.addEventListener('click', () => {
      this.close();
      this.triggerDeparture();
    });

    // Keyboard Shortcuts (Enter, E, Escape)
    window.addEventListener('keydown', (e) => {
      if (!this.currentStation) return;

      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      } else if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && !this.isOpen) {
        // Inspect current docked station
        if (this.currentStation.state === 'stopped') {
          e.preventDefault();
          this.openCurrentStation();
        }
      }
    });
  }

  /**
   * Shows the docked station indicator when train arrives and comes to a full stop
   */
  showDockedPrompt(station) {
    this.currentStation = station;
    const data = STATION_DATA[station.id] || {
      name: station.name,
      category: station.category,
      code: station.id.toUpperCase()
    };

    if (this.dockedTag) this.dockedTag.textContent = `${data.code} // ARRIVAL CONFIRMED`;
    if (this.dockedName) this.dockedName.textContent = data.name;

    this.dockedPrompt.classList.add('is-active');
  }

  /**
   * Hides the docked station indicator
   */
  hideDockedPrompt() {
    this.dockedPrompt.classList.remove('is-active');
  }

  /**
   * Opens the station content spatial modal
   */
  open(station) {
    if (!station) return;
    this.currentStation = station;
    this.isOpen = true;

    const data = STATION_DATA[station.id] || {
      id: station.id,
      code: station.id.toUpperCase(),
      name: station.name,
      category: station.category,
      tagline: 'PORTFOLIO ARCHIVE',
      summary: '',
      highlights: [],
      details: 'Station data archive.'
    };

    // Populate data
    this.modalCode.textContent = data.code;
    this.modalCategory.textContent = data.category.toUpperCase();
    this.modalTitle.textContent = data.name;
    this.modalTagline.textContent = data.tagline;
    this.modalDesc.textContent = data.details;

    // Render highlights
    if (this.modalHighlights) {
      this.modalHighlights.innerHTML = (data.highlights || [])
        .map((h) => `
          <div class="modal-highlight-item">
            <span class="highlight-label">${h.label}</span>
            <span class="highlight-value">${h.value}</span>
          </div>
        `)
        .join('');
    }

    if (this.audio) {
      this.audio.playStationInteract();
    }

    this.contentModal.classList.add('is-active');

    if (typeof this.onOpen === 'function') {
      this.onOpen(station);
    }
  }

  openCurrentStation() {
    if (this.currentStation) {
      this.open(this.currentStation);
    }
  }

  /**
   * Closes the station content spatial modal and returns camera
   */
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;

    if (this.audio) {
      this.audio.playStationClose();
    }

    this.contentModal.classList.remove('is-active');

    if (typeof this.onClose === 'function') {
      this.onClose(this.currentStation);
    }
  }

  /**
   * Triggers departure from station
   */
  triggerDeparture() {
    this.hideDockedPrompt();
    if (this.audio) {
      this.audio.playStationDepart();
    }
    if (typeof this.onDepart === 'function') {
      this.onDepart(this.currentStation);
    }
  }

  /**
   * Resets all UI elements
   */
  reset() {
    this.close();
    this.hideDockedPrompt();
    this.currentStation = null;
  }
}
