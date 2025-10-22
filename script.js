document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const pillContainer = document.querySelector('h1.largeDisplayText');

  let activeClones = []; // Keep track of the clones we create
  let isAnimating = false; // Prevent re-triggering while animation is in progress
  let pillObserver; // Declare here to be accessible in updateOnScroll

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

  // Intersection Observer for pill shake animation

  if (pillContainer) {
    pillObserver = new IntersectionObserver((entries, observer) => {
      // If the animation is already running, don't do anything.
      // This prevents conflicts when scrolling quickly.
      if (isAnimating) return;

      entries.forEach(entry => {
        // When scrolling into view from the top, and not already animating
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6 && !isAnimating) {
          isAnimating = true;
          const pills = Array.from(entry.target.querySelectorAll('.highlight-pill'));
          let stackedHeight = 0;
          const academicProjectsHeader = document.querySelector('h2.homepageSPACER');
          const boundaryRect = academicProjectsHeader ? academicProjectsHeader.getBoundingClientRect() : null;
          const boundaryTop = boundaryRect ? boundaryRect.top : window.innerHeight; // Fallback to bottom of screen if header not found

          // Clear any previous clones, just in case.
          activeClones.forEach(c => c.remove());
          activeClones = [];

          // Ensure original pills are visible before we start
          pills.forEach(pill => pill.classList.remove('is-falling'));

          pills.forEach((pill, index) => {
            // Hide the original pill
            pill.classList.add('is-falling');

            // 1. Create a clone
            const clone = pill.cloneNode(true);
            clone.classList.remove('is-falling'); // Ensure clone is visible
            clone.classList.add('falling-pill-clone');

            // 2. Get original position
            const rect = pill.getBoundingClientRect();

            // 3. Position clone exactly over the original
            clone.style.top = `${rect.top}px`;
            clone.style.left = `${rect.left}px`;
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            clone.style.margin = '0'; // Reset margin for fixed positioning

            document.body.appendChild(clone);
            // Add the clone to our list for cleanup later
            activeClones.push(clone);

            // 4. Calculate final destination
            const pillHeight = rect.height;
            const finalTop = boundaryTop - stackedHeight - pillHeight; // Stack upwards from the boundary
            
            // Update stacked height for the next pill
            stackedHeight += pillHeight + 5; // Add a small gap to prevent overlap from rotation

            // 5. Animate using a timeout for a staggered effect
            setTimeout(() => {
              // Set the final transform to trigger the CSS transition.
              const randomRotation = Math.random() * 12 - 6; // Random angle between -6 and +6 deg
              const randomXOffset = Math.random() * 20 - 10; // Random horizontal shift between -10px and +10px
              const finalTransform = `translateY(${finalTop - rect.top}px) translateX(${randomXOffset}px) rotate(${randomRotation}deg)`;
              clone.style.transform = finalTransform;

            }, index * 200); // 200ms delay between each pill
          });

          // After all pills have fallen and stacked, wait a few seconds, then clean up.
          const fallDuration = 1000; // From the CSS transition
          const staggerDuration = pills.length * 200;
          const waitDuration = 2000; // 2 seconds
          const totalAnimationTime = staggerDuration + fallDuration + waitDuration;

          setTimeout(() => {
            // Remove all the clones from the page
            activeClones.forEach(clone => clone.remove());
            activeClones = [];
            // Make the original pills visible again and reset the animation state.
            const originalPills = pillContainer.querySelectorAll('.highlight-pill');
            originalPills.forEach(pill => pill.classList.remove('is-falling'));
            isAnimating = false;
          }, totalAnimationTime);
        }
      });
    }, {
      root: null,
      threshold: 0.6 // Trigger when 60% of the element is visible
    });

    pillObserver.observe(pillContainer);
  }


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

  // --- Lightbox Functionality ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.querySelector('.lightbox-close');

  if (lightbox && lightboxImg && closeBtn) {
    // Select the <a> tags that have the lightbox-trigger class
    const triggerLinks = document.querySelectorAll('a.lightbox-trigger');

    triggerLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default link behavior
        lightbox.style.display = 'block';
        lightboxImg.src = link.querySelector('img').src; // Get the src from the img inside the clicked link
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      });
    });

    // Function to close the lightbox
    const closeLightbox = () => {
      lightbox.style.display = 'none';
      document.body.style.overflow = 'auto'; // Restore scrolling
    };

    // Close on 'x' button click
    closeBtn.addEventListener('click', closeLightbox);

    // Close on background click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) { // Only close if the background is clicked, not the image
        closeLightbox();
      }
    });
  }
});