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

  // Check for auth errors in URL (e.g. from OAuth callback redirects)
  const urlParams = new URLSearchParams(window.location.search);
  const authError = urlParams.get('auth_error');
  if (authError) {
    let displayError = authError;
    if (authError.includes('Unable to exchange external code')) {
      const currentLang = getCurrentLanguage();
      displayError = currentLang === 'en'
        ? 'Google Sign-In configuration error: Please check your Google Client ID and Client Secret in the Supabase Dashboard.'
        : 'Google ile Giriş yapılandırma hatası: Lütfen Supabase Panelindeki Google Client ID ve Client Secret ayarlarınızı kontrol edin.';
    }
    setTimeout(() => {
      showToast(displayError, 'error');
    }, 100);
    
    // Clean URL query parameters
    const cleanSearch = window.location.search.replace(/[\?&]auth_error=[^&]+/, '').replace(/^&/, '?').replace(/\?$/, '');
    const cleanUrl = window.location.pathname + cleanSearch;
    window.history.replaceState({}, document.title, cleanUrl);
  }

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
      const cacheBust = '?v=20260628';
      const targetSrc = currentLang === 'en'
        ? '/MayaListing_Sunum_EN.mp4' + cacheBust
        : '/MayaListing_Sunum.mp4' + cacheBust;
      const currentSrc = promoVideo.getAttribute('src');
      if (!currentSrc || !currentSrc.startsWith(targetSrc.split('?')[0])) {
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

  // Wire up the language switcher in nav-actions (initial setup before auth state fires).
  // index.html ships a static switcher to avoid header CLS; createLanguageSwitcher
  // hydrates it in place instead of injecting a duplicate.
  const navActionsInitial = document.getElementById('nav-auth-actions');
  if (navActionsInitial) {
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
  let yearly = false;
  const pricingSwitch = document.getElementById('pricing-switch');
  if (pricingSwitch) {
    const lblM = document.getElementById('lbl-monthly');
    const lblY = document.getElementById('lbl-yearly');

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

  // Pricing CTA buttons click (must be after `yearly` is declared)
  document.querySelectorAll('.pricing-cta-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan');
      const billingCycle = yearly ? 'yearly' : 'monthly';

      // Save to sessionStorage to persist after signup/login redirects
      sessionStorage.setItem('pending_plan', plan);
      sessionStorage.setItem('pending_cycle', billingCycle);

      if (currentSessionUser) {
        // Logged in user: redirect to billing dashboard directly
        window.location.href = `/app/?tab=billing&selectPlan=${plan}&cycle=${billingCycle}`;
      } else {
        // Not logged in: open signup modal
        openModal('signup-modal');
      }
    });
  });

  // Interactive Product Demo Logic
  let currentDemoPlatform = 'trendyol';
  const demoData = {
    trendyol: {
      tr: {
        title: "El Yapımı Rustik Seramik Kahve Fincanı & Tabak Seti - 250 ml Özel Tasarım",
        desc: `✨ **ÖNE ÇIKAN ÖZELLİKLER** ✨\n• %100 El Yapımı: Usta seramik sanatçıları tarafından özenle şekillendirilmiştir.\n• Gıdaya Uygun: Kurşunsuz doğal sır ile sırlanmış, sağlığa zararsızdır.\n• Bulaşık Makinesi & Mikrodalga: Dayanıklı stoneware çamuru ile fırınlanmıştır.\n• Hediye Paketi: Özel kraft kutusunda kırılmaya karşı korumalı paketleme.`,
        tags: ["seramik fincan", "kahve kupası", "el yapımı kupa", "hediye fincan", "espresso fincanı", "seramik tabak", "rustik kupa", "tasarım fincan", "latte bardağı", "türk kahvesi fincanı"]
      },
      en: {
        title: "Handmade Rustic Ceramic Coffee Mug & Saucer Set - 8.5 oz Artisan Stoneware Cup",
        desc: `✨ **PRODUCT HIGHLIGHTS** ✨\n• 100% Handmade: Handcrafted by skilled ceramic artisans using durable stoneware clay.\n• Food-Safe Glaze: Finished with lead-free natural glaze, safe for hot beverages.\n• Dishwasher & Microwave Safe: High-fired stoneware engineered for daily durability.\n• Gift Ready: Safely packed in eco-friendly protective kraft gift packaging.`,
        tags: ["ceramic mug", "coffee cup", "handmade pottery", "artisan mug", "rustic stoneware", "tea cup", "espresso cup", "gift for coffee lover", "stoneware saucer"]
      }
    },
    amazon: {
      tr: {
        title: "El Yapımı Rustik Seramik Kahve Kupası ve Tabağı, 250 ml Çömlek Çay Fincanı, Kahvesever Hediyesi",
        desc: `☕ **ÖZEL ÇÖMLEK İŞÇİLİĞİ**\n• Doğal stoneware çamuru ile elde şekillendirilmiş, mat toprak tonlarında sırlanmıştır.\n• Konforlu ve dengeli tutuş sağlayan ergonomik kulp tasarımı.\n• Günlük kullanım için gıdaya, bulaşık makinesine ve mikrodalgaya uygun.\n• Hediye edilmeye hazır kırılma önleyici özel ambalaj.`,
        tags: ["seramik kahve kupası", "el yapımı çömlek", "rustik fincan", "kahve hediye seti", "minimalist kupa", "mutfak dekoru", "tabaklı fincan", "özel tasarım kupa"]
      },
      en: {
        title: "Handmade Ceramic Coffee Mug with Saucer, 8.5 oz Rustic Stoneware Tea Cup, Artisan Pottery Gift for Coffee Lovers",
        desc: `☕ **ARTISAN CRAFTSMANSHIP**\n• Handcrafted with natural stoneware clay and finished in a matte earthy glaze.\n• Ergonomic handle designed for a comfortable, balanced grip.\n• Food safe, microwave safe, and dishwasher safe for daily rituals.\n• Carefully packaged in eco-friendly protective packaging ready for gifting.`,
        tags: ["ceramic coffee mug", "handmade pottery", "rustic stoneware", "coffee lover gift", "artisan mug", "pottery tea cup", "unique ceramic cup", "minimalist mug", "studio pottery", "kitchen decor", "housewarming gift"]
      }
    },
    adobe: {
      tr: {
        title: "Rustik ahşap masa üzerinde minimalist el yapımı seramik kahve fincanı ve tabağı",
        desc: "Doğal dokulu ahşap yüzeyde taze sıcak kahve ile el yapımı çömlek seramik fincanın üstten çekimi. Yüksek çözünürlüklü ticari stok fotoğrafı.",
        tags: ["kahve", "seramik", "fincan", "kupa", "çömlek", "tabak", "el yapımı", "rustik", "ahşap", "espresso", "içecek", "sabah", "sıcak", "kahverengi", "masaüstü", "kahvaltı", "kafe", "aroma", "porselen", "minimal", "yaşam tarzı", "stüdyo çekimi", "still life", "rahatlama"]
      },
      en: {
        title: "Minimalist handmade ceramic coffee mug with saucer on rustic wooden background",
        desc: "Top view of artisan pottery ceramic cup with fresh hot coffee placed on textured timber surface. High resolution commercial photo.",
        tags: ["coffee", "ceramic", "mug", "cup", "pottery", "saucer", "handmade", "rustic", "wooden", "artisan", "espresso", "beverage", "morning", "warm", "brown", "tabletop", "breakfast", "cafe", "drink", "aroma", "porcelain", "minimal", "craft", "lifestyle", "studio shot", "still life", "relaxation"]
      }
    },
    shutterstock: {
      tr: {
        title: "Doğal Ahşap Masa Üzerinde Eşleşen Tabaklı El Yapımı Seramik Kahve Fincanı - Stok Fotoğrafı",
        desc: "Ahşap masada dinlenen tabaklı el yapımı stoneware seramik fincanda taze demlenmiş sıcak kahvenin yakın çekimi. Ticari ve editoryal kullanım için yüksek çözünürlüklü görsel.",
        tags: ["kahve", "seramik fincan", "kahve kupası", "el yapımı çömlek", "stoneware", "rustik", "ahşap masa", "kafe kültürü", "sıcak içecek", "espresso", "kafein", "sabah rutini", "tabak", "işçilik", "masaüstü", "yaşam tarzı", "içecek", "still life", "ticari kullanım", "stok görsel"]
      },
      en: {
        title: "Artisan Handmade Ceramic Coffee Cup with Matching Saucer on Natural Wooden Table - Stock Photo",
        desc: "Close-up of freshly brewed warm coffee in a handcrafted stoneware ceramic cup with saucer resting on wooden table. High-resolution image ideal for commercial and editorial use.",
        tags: ["coffee", "ceramic cup", "coffee mug", "handmade pottery", "stoneware", "rustic", "timber table", "cafe culture", "hot drink", "espresso", "caffeine", "morning routine", "saucer", "artisan", "craftsmanship", "tabletop", "lifestyle", "beverage", "cozy", "relaxation", "minimal", "organic", "commercial use", "stock image"]
      }
    }
  };

  const renderDemoPlatform = (platformKey) => {
    currentDemoPlatform = platformKey;
    const currentLang = getCurrentLanguage();
    const data = demoData[platformKey]?.[currentLang] || demoData[platformKey]?.['tr'];
    if (!data) return;

    const titleEl = document.getElementById('demo-output-title');
    const descEl = document.getElementById('demo-output-desc');
    const tagsContainer = document.getElementById('demo-output-tags');
    const tagsTextEl = document.getElementById('demo-output-tags-text');

    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.desc;
    if (tagsContainer) {
      tagsContainer.innerHTML = data.tags.map(tag => `<span class="demo-tag-chip">${tag}</span>`).join('');
    }
    if (tagsTextEl) {
      tagsTextEl.textContent = data.tags.join(', ');
    }

    // Update active tab buttons
    document.querySelectorAll('.demo-tab-btn').forEach(btn => {
      const isSelected = btn.getAttribute('data-platform') === platformKey;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  };

  // Demo Tab Click Listeners
  document.querySelectorAll('.demo-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.getAttribute('data-platform');
      if (platform) renderDemoPlatform(platform);
    });
  });

  // Demo Copy Buttons
  document.querySelectorAll('.demo-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const textToCopy = targetEl.textContent || targetEl.innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalText = btn.textContent;
          btn.textContent = t('demo.copied');
          btn.style.borderColor = '#34C759';
          btn.style.color = '#34C759';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.borderColor = '';
            btn.style.color = '';
          }, 2000);
        }).catch(err => {
          console.error('Clipboard copy failed:', err);
        });
      }
    });
  });

  // Segment Cards CTAs (Direct anchor + tab select)
  const segmentEcomCta = document.getElementById('segment-ecom-cta');
  const segmentStockCta = document.getElementById('segment-stock-cta');

  if (segmentEcomCta) {
    segmentEcomCta.addEventListener('click', () => {
      renderDemoPlatform('trendyol');
      document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (segmentStockCta) {
    segmentStockCta.addEventListener('click', () => {
      renderDemoPlatform('adobe');
      document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Initial render of demo platform
  renderDemoPlatform('trendyol');

  // Re-render demo on language changed
  window.addEventListener('languageChanged', () => {
    renderDemoPlatform(currentDemoPlatform);
  });
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
