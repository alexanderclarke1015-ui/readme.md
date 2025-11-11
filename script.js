const field = document.querySelector('.field');
const counterElement = document.getElementById('counter');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

let sheepCount = 0;
let intervalId = null;
let audioController = null;

class Lullaby {
  constructor() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.05;
    this.masterGain.connect(this.context.destination);

    this.oscillators = [
      this.createOscillator(220),
      this.createOscillator(329.63)
    ];
  }

  createOscillator(frequency) {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.value = frequency;

    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.05, this.context.currentTime, 2.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();

    return { osc, gain };
  }

  fadeOut() {
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(0, now, 1.5);
  }

  stop() {
    this.fadeOut();
    setTimeout(() => {
      this.oscillators.forEach(({ osc }) => osc.stop());
      this.context.close();
    }, 2000);
  }
}

function updateCounter() {
  counterElement.textContent = `Sheep Count: ${sheepCount}`;
}

function createSheep() {
  const sheep = document.createElement('div');
  sheep.className = 'sheep';
  sheep.innerHTML = `
    <div class="sheep-body">
      <div class="sheep-head">
        <div class="ear"></div>
        <div class="eye"></div>
        <div class="blush"></div>
      </div>
      <div class="leg front"></div>
      <div class="leg back"></div>
    </div>
  `;

  sheep.addEventListener('animationend', () => {
    sheep.remove();
    sheepCount += 1;
    updateCounter();
  });

  field.appendChild(sheep);
}

function startCounting() {
  if (intervalId) {
    return;
  }

  if (field.classList.contains('paused')) {
    field.classList.remove('paused');
    resumeAnimations();
  }

  createSheep();
  intervalId = setInterval(createSheep, 2000);

  if (!audioController) {
    try {
      audioController = new Lullaby();
    } catch (error) {
      console.warn('Unable to start lullaby audio:', error);
    }
  }
}

function stopCounting() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }

  field.classList.add('paused');
  pauseAnimations();

  if (audioController) {
    audioController.stop();
    audioController = null;
  }
}

function pauseAnimations() {
  field.querySelectorAll('.sheep').forEach((sheep) => {
    sheep.style.animationPlayState = 'paused';
  });
}

function resumeAnimations() {
  field.querySelectorAll('.sheep').forEach((sheep) => {
    sheep.style.animationPlayState = 'running';
  });
}

startBtn.addEventListener('click', () => {
  startCounting();
  if (audioController && audioController.context.state === 'suspended') {
    audioController.context.resume();
  }
});

stopBtn.addEventListener('click', stopCounting);

// Provide keyboard accessibility hints
[startBtn, stopBtn].forEach((button) => {
  button.addEventListener('keyup', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      button.click();
    }
  });
});
