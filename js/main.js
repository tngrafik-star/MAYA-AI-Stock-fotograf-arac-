import { initDB, getCurrentUser } from './db.js';
import { login, signup, loginWithGoogle, resetPassword } from './auth.js';

// Initialize Database on load
initDB();

const initMain = () => {
  // Check session state to update navigation
  const currentUser = getCurrentUser();
  const navAuthActions = document.getElementById('nav-auth-actions');
  const heroPrimaryCta = document.getElementById('hero-primary-cta');
  const finalCtaBtn = document.getElementById('final-cta-btn');

  if (currentUser) {
    // Update Header buttons
    navAuthActions.innerHTML = `
      <span style="font-size: 13px; color: var(--color-text-secondary); font-weight: 500;">Hoş Geldin, <strong>${currentUser.name}</strong></span>
      <a href="/app/" class="btn btn-primary">Panele Git</a>
    `;
    // Update Hero CTA
    if (heroPrimaryCta) {
      heroPrimaryCta.textContent = 'Panele Git';
      heroPrimaryCta.addEventListener('click', () => {
        window.location.href = '/app/';
      });
    }
    // Update Final CTA
    if (finalCtaBtn) {
      finalCtaBtn.textContent = 'Panele Git';
      finalCtaBtn.addEventListener('click', () => {
        window.location.href = '/app/';
      });
    }
  } else {
    // Setup regular event listeners for CTA modals
    if (heroPrimaryCta) {
      heroPrimaryCta.addEventListener('click', () => openModal('signup-modal'));
    }
    if (finalCtaBtn) {
      finalCtaBtn.addEventListener('click', () => openModal('signup-modal'));
    }
  }

  // Header background on scroll
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Modal Open/Close Event Listeners
  const openLoginBtn = document.getElementById('open-login-btn');
  const openSignupBtn = document.getElementById('open-signup-btn');
  const closeLoginBtn = document.getElementById('close-login-btn');
  const closeSignupBtn = document.getElementById('close-signup-btn');
  
  if (openLoginBtn) openLoginBtn.addEventListener('click', () => openModal('login-modal'));
  if (openSignupBtn) openSignupBtn.addEventListener('click', () => openModal('signup-modal'));
  if (closeLoginBtn) closeLoginBtn.addEventListener('click', () => closeModal('login-modal'));
  if (closeSignupBtn) closeSignupBtn.addEventListener('click', () => closeModal('signup-modal'));

  // Switch between modals
  const linkToSignup = document.getElementById('link-to-signup');
  const linkToLogin = document.getElementById('link-to-login');
  const openForgotBtn = document.getElementById('open-forgot-btn');
  const linkBackToLogin = document.getElementById('link-back-to-login');
  const closeForgotBtnX = document.getElementById('close-forgot-btn-x');

  if (linkToSignup) {
    linkToSignup.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal('login-modal');
      openModal('signup-modal');
    });
  }
  if (linkToLogin) {
    linkToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal('signup-modal');
      openModal('login-modal');
    });
  }
  if (openForgotBtn) {
    openForgotBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal('login-modal');
      openModal('forgot-modal');
    });
  }
  if (linkBackToLogin) {
    linkBackToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal('forgot-modal');
      openModal('login-modal');
    });
  }
  if (closeForgotBtnX) {
    closeForgotBtnX.addEventListener('click', () => closeModal('forgot-modal'));
  }

  // Backdrop click closes modals
  document.querySelectorAll('.modal').forEach(modal => {
    const backdrop = modal.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => closeModal(modal.id));
    }
  });

  // Modal Auth Forms Submissions
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const forgotForm = document.getElementById('forgot-form');

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;

      try {
        await signup(name, email, password);
        showToast('Hesap başarıyla oluşturuldu! Yönlendiriliyorsunuz...', 'success');
        setTimeout(() => {
          window.location.href = '/app/';
        }, 1500);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        await login(email, password);
        showToast('Başarıyla giriş yapıldı! Yönlendiriliyorsunuz...', 'success');
        setTimeout(() => {
          window.location.href = '/app/';
        }, 1500);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value;

      try {
        await resetPassword(email);
        showToast('Şifre sıfırlama bağlantısı e-postanıza gönderildi.', 'success');
        closeModal('forgot-modal');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Google Login button handlers
  const googleLoginBtn1 = document.getElementById('google-login-btn-1');
  const googleLoginBtn2 = document.getElementById('google-login-btn-2');

  const handleGoogleLogin = async () => {
    try {
      showToast('Google ile giriş sayfasına yönlendiriliyorsunuz...', 'success');
      await loginWithGoogle();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (googleLoginBtn1) googleLoginBtn1.addEventListener('click', handleGoogleLogin);
  if (googleLoginBtn2) googleLoginBtn2.addEventListener('click', handleGoogleLogin);

  // Pricing CTA buttons click
  document.querySelectorAll('.pricing-cta-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan');
      if (currentUser) {
        // Logged in user: redirect to billing dashboard directly
        window.location.href = `/app/?tab=billing&selectPlan=${plan}`;
      } else {
        // Not logged in: open signup modal
        openModal('signup-modal');
      }
    });
  });

  // FAQ Accordion Collapsible Toggles
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all other items
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        otherItem.querySelector('.faq-answer').style.maxHeight = null;
      });
      
      // Open selected item
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // Theme Toggle Logic
  const themeToggleBtn = document.getElementById('landing-theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('maya-theme', newTheme);
    });
  }

  // Video Player Logic
  const promoVideo = document.getElementById('promo-video');
  const videoPlayBtn = document.getElementById('video-play-btn');
  const videoMuteBtn = document.getElementById('video-mute-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const muteIcon = document.getElementById('mute-icon');
  const unmuteIcon = document.getElementById('unmute-icon');

  if (promoVideo) {
    const togglePlay = () => {
      if (promoVideo.paused) {
        promoVideo.play().catch(e => console.log('Video play error:', e));
      } else {
        promoVideo.pause();
      }
    };

    const toggleMute = (e) => {
      e.stopPropagation();
      promoVideo.muted = !promoVideo.muted;
    };

    promoVideo.addEventListener('play', () => {
      if (playIcon) playIcon.style.display = 'none';
      if (pauseIcon) pauseIcon.style.display = 'block';
    });

    promoVideo.addEventListener('pause', () => {
      if (playIcon) playIcon.style.display = 'block';
      if (pauseIcon) pauseIcon.style.display = 'none';
    });

    promoVideo.addEventListener('volumechange', () => {
      if (promoVideo.muted) {
        if (muteIcon) muteIcon.style.display = 'block';
        if (unmuteIcon) unmuteIcon.style.display = 'none';
      } else {
        if (muteIcon) muteIcon.style.display = 'none';
        if (unmuteIcon) unmuteIcon.style.display = 'block';
      }
    });

    promoVideo.parentElement.addEventListener('click', togglePlay);
    if (videoPlayBtn) videoPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });
    if (videoMuteBtn) videoMuteBtn.addEventListener('click', toggleMute);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMain);
} else {
  initMain();
}

// Helper functions for Modals and Toasts
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '✓';
  if (type === 'error') icon = '✕';
  if (type === 'warning') icon = '⚠';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-text">${message}</span>
  `;

  container.appendChild(toast);

  // Remove toast after 3.5 seconds
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3500);
}
