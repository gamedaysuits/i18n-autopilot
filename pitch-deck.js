const slides = document.querySelectorAll('.slide');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const counter = document.getElementById('counter');
const teletype = document.getElementById('teletype');

let currentSlide = 0;
let typeWriterInterval = null;

// The global teletypeMessages array is expected to be defined in the HTML file

function updateTeletype(index) {
  if (!window.teletypeMessages || window.teletypeMessages.length === 0) return;
  if(typeWriterInterval) clearInterval(typeWriterInterval);
  
  let msg = window.teletypeMessages[index] || window.teletypeMessages[0];
  teletype.innerHTML = '';
  let i = 0;
  
  typeWriterInterval = setInterval(() => {
    if (i < msg.length) {
      if(msg.substring(i, i+2) === '\\n') {
        teletype.innerHTML += '<br>';
        i += 2;
      } else {
        teletype.innerHTML += msg.charAt(i);
        i++;
      }
    } else {
      clearInterval(typeWriterInterval);
    }
  }, 30);
}

function showSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.remove('active');
    if (i === index) slide.classList.add('active');
  });
  
  counter.innerText = `0${index + 1} / 0${slides.length}`;
  updateTeletype(index);

  prevBtn.disabled = (index === 0);
  
  if (index === slides.length - 1) {
    nextBtn.innerHTML = 'DEPLOY <span class="arrow">➔</span>';
  } else {
    nextBtn.innerHTML = 'NEXT <span class="arrow">➔</span>';
  }
}

nextBtn.addEventListener('click', () => {
  if (currentSlide < slides.length - 1) {
    currentSlide++;
    showSlide(currentSlide);
  }
});

prevBtn.addEventListener('click', () => {
  if (currentSlide > 0) {
    currentSlide--;
    showSlide(currentSlide);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    if (currentSlide < slides.length - 1) {
      currentSlide++;
      showSlide(currentSlide);
    }
  } else if (e.key === 'ArrowLeft') {
    if (currentSlide > 0) {
      currentSlide--;
      showSlide(currentSlide);
    }
  }
});

showSlide(0);
