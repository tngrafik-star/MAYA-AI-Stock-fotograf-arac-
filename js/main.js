import { initDB, getCurrentUser } from './db.js';
import { login, signup, loginWithGoogle, resetPassword } from './auth.js';
import { t, applyTranslations, updateSEOMeta, updateHtmlLang, getCurrentLanguage } from './i18n/index.js';
import { createLanguageSwitcher } from './languageSwitcher.js';
import { supabase } from './supabase.js';

// Initialize Database on load
initDB();

// Apply initial i18n translations and SEO
updateHtmlLang();
updateSEOMeta();

const initMain = () => {
  const navAuthActions = document.getElementById('nav-auth-actions');
  const heroPrimaryCta = document.getElementById('hero-primary-cta');
  const finalCtaBtn = document.getElementById('final-cta-btn');
  let currentSessionUser = null;

  // Setup theme toggle listener helper
  const setupThemeToggleListener = () => {
    const themeToggleBtn = document.getElementById('landing-theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.replaceWith(themeToggleBtn.cloneNode(true));
      const newToggleBtn = document.getElementById('landing-theme-toggle');
      newToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('maya-theme', newTheme);
      });
    }
  };

  // Listen for auth state changes to update UI reactively
  supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user;
    currentSessionUser = user ? getCurrentUser() || user : null;
    
    // Helper function to update landing page UI once name is resolved
    const updateUI = (name) => {
      if (user) {
        if (navAuthActions) {
          navAuthActions.innerHTML = `
            <button class="theme-toggle-btn" id="landing-theme-toggle" title="Temayı Değiştir" data-i18n-title="nav.changeTheme" style="margin-right: 12px; display: inline-flex; align-items: center; justify-content: center; background: none; border: 1px solid var(--color-border); cursor: pointer; color: var(--color-text-primary); width: 38px; height: 38px; border-radius: var(--border-radius-sm);">
              <svg class="theme-icon moon-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            </button>
            <span style="font-size: 13px; color: var(--color-text-secondary); font-weight: 500; margin-right: 12px;" data-i18n-html="nav.welcomeBack">${t('nav.welcomeBack', { name: name })}</span>
            <a href="/app/" class="btn btn-primary" data-i18n="nav.goToPanel">${t('nav.goToPanel')}</a>
          `;
        }
        const currentHeroCta = document.getElementById('hero-primary-cta');
        if (currentHeroCta) {
          currentHeroCta.textContent = t('nav.goToPanel');
          const newBtn = currentHeroCta.cloneNode(true);
          currentHeroCta.replaceWith(newBtn);
          newBtn.addEventListener('click', () => {
            window.location.href = '/app/';
          });
        }
        const currentFinalCta = document.getElementById('final-cta-btn');
        if (currentFinalCta) {
          currentFinalCta.textContent = t('nav.goToPanel');
          const newBtn = currentFinalCta.cloneNode(true);
          currentFinalCta.replaceWith(newBtn);
          newBtn.addEventListener('click', () => {
            window.location.href = '/app/';
          });
        }
      } else {
        if (navAuthActions) {
          navAuthActions.innerHTML = `
            <button class="theme-toggle-btn" id="landing-theme-toggle" title="Temayı Değiştir" data-i18n-title="nav.changeTheme" style="margin-right: 8px;">
              <svg class="theme-icon moon-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            </button>
            <button class="btn-text" id="open-login-btn" data-i18n="nav.login">${t('nav.login')}</button>
            <button class="btn btn-primary" id="open-signup-btn" data-i18n="nav.tryFree">${t('nav.tryFree')}</button>
          `;
          document.getElementById('open-login-btn')?.addEventListener('click', () => openModal('login-modal'));
          document.getElementById('open-signup-btn')?.addEventListener('click', () => openModal('signup-modal'));
        }
        const currentHeroCta = document.getElementById('hero-primary-cta');
        if (currentHeroCta) {
          currentHeroCta.textContent = t('hero.ctaTryFree');
          const newBtn = currentHeroCta.cloneNode(true);
          currentHeroCta.replaceWith(newBtn);
          newBtn.addEventListener('click', () => openModal('signup-modal'));
        }
        const currentFinalCta = document.getElementById('final-cta-btn');
        if (currentFinalCta) {
          currentFinalCta.textContent = t('cta.button');
          const newBtn = currentFinalCta.cloneNode(true);
          currentFinalCta.replaceWith(newBtn);
          newBtn.addEventListener('click', () => openModal('signup-modal'));
        }
      }
      setupThemeToggleListener();
      // Re-create language switcher on nav rebuild
      const navActionsEl = document.getElementById('nav-auth-actions');
      if (navActionsEl) {
        createLanguageSwitcher(navActionsEl, 'prepend');
      }
    };

    if (user) {
      const initialName = user.user_metadata?.name || user.email.split('@')[0];
      const localUser = getCurrentUser();
      const displayName = (localUser && localUser.id === user.id) ? localUser.name : initialName;
      
      // Update UI immediately with initial name
      updateUI(displayName);

      // Fetch official name asynchronously to avoid deadlock
      if (!localUser || localUser.id !== user.id) {
        setTimeout(async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', user.id)
              .maybeSingle();
            if (profile && profile.name) {
              updateUI(profile.name);
            }
          } catch (e) {
            console.error('Failed to fetch profile name in main.js:', e);
          }
        }, 0);
      }
    } else {
      updateUI('Kullanıcı');
    }
  });

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

  // Legal Modals Event Listeners
  const openTermsBtn = document.getElementById('open-terms-btn');
  const openPrivacyBtn = document.getElementById('open-privacy-btn');
  const openKvkkBtn = document.getElementById('open-kvkk-btn');

  const closeTermsBtn = document.getElementById('close-terms-btn');
  const closePrivacyBtn = document.getElementById('close-privacy-btn');
  const closeKvkkBtn = document.getElementById('close-kvkk-btn');

  if (openTermsBtn) {
    openTermsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('terms-modal');
    });
  }
  if (openPrivacyBtn) {
    openPrivacyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('privacy-modal');
    });
  }
  if (openKvkkBtn) {
    openKvkkBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('kvkk-modal');
    });
  }

  if (closeTermsBtn) closeTermsBtn.addEventListener('click', () => closeModal('terms-modal'));
  if (closePrivacyBtn) closePrivacyBtn.addEventListener('click', () => closeModal('privacy-modal'));
  if (closeKvkkBtn) closeKvkkBtn.addEventListener('click', () => closeModal('kvkk-modal'));

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
        
        // Wait and check if session is active immediately
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          showToast(t('toast.accountCreated'), 'success');
          setTimeout(() => {
            window.location.href = '/app/';
          }, 1500);
        } else {
          showToast(t('toast.signupVerify'), 'warning');
          closeModal('signup-modal');
        }
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
        showToast(t('toast.loginSuccess'), 'success');
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
        showToast(t('toast.resetSent'), 'success');
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
      showToast(t('toast.googleRedirect'), 'success');
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
      if (currentSessionUser) {
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

  // Theme toggle listener is set up within the supabase auth change listener to keep buttons bound.

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

  const updateVideoSource = () => {
    const promoVideo = document.getElementById('promo-video');
    if (promoVideo) {
      const currentLang = getCurrentLanguage();
      const targetSrc = currentLang === 'en' ? '/MayaSolutions_Sunum_EN.mp4' : '/MayaSolutions_Sunum.mp4';
      if (promoVideo.getAttribute('src') !== targetSrc) {
        promoVideo.setAttribute('src', targetSrc);
        const wasPaused = promoVideo.paused;
        promoVideo.load();
        if (!wasPaused) {
          promoVideo.play().catch(e => console.log('Video play error on source switch:', e));
        }
      }
    }
  };

  // Apply i18n translations to the DOM after everything is set up
  applyTranslations();
  updateVideoSource();

  // Create language switcher in nav-actions (initial setup before auth state fires)
  const navActionsInitial = document.getElementById('nav-auth-actions');
  if (navActionsInitial && !navActionsInitial.querySelector('.lang-switcher')) {
    createLanguageSwitcher(navActionsInitial, 'prepend');
  }

  // Listen for language changes to re-apply DOM translations
  window.addEventListener('languageChanged', () => {
    applyTranslations();
    updateSEOMeta();
    updateHtmlLang();
    updateVideoSource();
    if (currentSessionUser) {
      const welcomeSpan = document.querySelector('[data-i18n-html="nav.welcomeBack"]');
      if (welcomeSpan) {
        const localUser = getCurrentUser();
        const name = localUser?.name || currentSessionUser.user_metadata?.name || currentSessionUser.email.split('@')[0];
        welcomeSpan.innerHTML = t('nav.welcomeBack', { name: name });
      }
    }
  });

  // Pricing toggle monthly / yearly
  const pricingSwitch = document.getElementById('pricing-switch');
  if (pricingSwitch) {
    const lblM = document.getElementById('lbl-monthly');
    const lblY = document.getElementById('lbl-yearly');
    let yearly = false;

    pricingSwitch.addEventListener('click', () => {
      yearly = !yearly;
      pricingSwitch.classList.toggle('on', yearly);
      lblM.classList.toggle('active', !yearly);
      lblY.classList.toggle('active', yearly);

      document.querySelectorAll('.price-val[data-m]').forEach(el => {
        el.textContent = yearly ? el.getAttribute('data-y') : el.getAttribute('data-m');
      });

      document.querySelectorAll('.quota-val[data-m]').forEach(el => {
        el.textContent = yearly ? el.getAttribute('data-y') : el.getAttribute('data-m');
      });
    });
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
