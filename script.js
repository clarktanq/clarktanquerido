document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  let isTicking = false;

  // Function to update UI on scroll
  const updateOnScroll = () => {
    // Header class logic
    if (window.scrollY > 0) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Progress circle logic
    const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (window.scrollY / totalHeight) * 100;
    if (progressBar) {
      progressBar.style.strokeDasharray = progress + ', 100';
    }

    if (progressText) {
      progressText.textContent = Math.round(progress) + '%';
    }

    isTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(updateOnScroll);
      isTicking = true;
    }
  });

  // Intersection Observer for fade-in animations
  const caseStudies = document.querySelectorAll('.case-study');

  const observerOptions = {
    root: null, // Use the viewport as the root
    rootMargin: '0px',
    threshold: 0.1 // Trigger when 10% of the element is visible
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Stop observing once it's visible
      }
    });
  }, observerOptions);

  caseStudies.forEach(card => observer.observe(card));

  // Click-to-play/pause functionality for project videos
  const projectVideos = document.querySelectorAll('.project-video');

  projectVideos.forEach(video => {
    const container = video.closest('.video-container'); // Get the parent container
    const muteBtn = container ? container.querySelector('.mute-unmute-icon') : null;
    const progressRing = container ? container.querySelector('.video-progress-ring__fg') : null;
    if (!container) return;

    // --- Setup for Circular Progress ---
    const radius = progressRing ? progressRing.r.baseVal.value : 0;
    const circumference = radius * 2 * Math.PI;
    if (progressRing) {
      progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
      progressRing.style.strokeDashoffset = circumference;
    }

    // Play/Pause on container click
    container.addEventListener('click', async () => {
      if (video.paused) {
        try {
          // If the video is marked as having audio, unmute it on play
          if (video.dataset.hasAudio === 'true') {
            video.muted = false;
            if (muteBtn) muteBtn.classList.remove('is-muted');
          }
          await video.play(); // Await the play promise
          container.classList.add('playing');
        } catch (error) {
          console.error('Error attempting to play video:', error);
        }
      } else {
        video.pause();
        container.classList.remove('playing');
      }
    });

    // Event listener for time updates
    video.addEventListener('timeupdate', () => {
      if (progressRing && video.duration) {
        const progress = video.currentTime / video.duration;
        const offset = circumference - progress * circumference;
        progressRing.style.strokeDashoffset = offset;
      }
    });

  });

  // Mute/Unmute on button click
  document.querySelectorAll('.mute-unmute-icon').forEach(muteBtn => {
    muteBtn.addEventListener('click', e => {
      e.stopPropagation(); // Prevent the container's click event from firing

      const container = muteBtn.closest('.video-container');
      const video = container ? container.querySelector('video') : null;
      if (!video) return;

      video.muted = !video.muted;
      muteBtn.classList.toggle('is-muted', video.muted);
    });
  });

  // Observer for changing body background color
  const slideUpSection = document.querySelector('.slide-up-section');
  if (slideUpSection) {
    const backgroundObserverOptions = {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0.01 // Trigger when 1% of the section is visible
    };

    const backgroundObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.body.classList.add('dark-section-active');
        } else {
          document.body.classList.remove('dark-section-active');
        }
      });
    }, backgroundObserverOptions);

    backgroundObserver.observe(slideUpSection);
  }
});