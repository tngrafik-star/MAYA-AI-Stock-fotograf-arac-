import { initDB, getCurrentUser, getUserHistory, saveGeneration, getActivityLogs } from './db.js';
import { logout, updateProfile, updateSubscription } from './auth.js';
import { getCategories, generateAIData, generateGeminiMetadata } from './ai.js';
import { supabase } from './supabase.js';
import { t, applyTranslations, updateSEOMeta, updateHtmlLang, getDateLocale, getCurrentLanguage, translateActivityLog } from './i18n/index.js';
import { createLanguageSwitcher } from './languageSwitcher.js';

// Seed DB just in case
initDB();

// Apply initial i18n
updateHtmlLang();
updateSEOMeta();

const initApp = async () => {
  console.log('📂 [Debug] initApp starting...');
  
  // 1. Session Verification (with a 3-second timeout protection to prevent deadlocks/freezes)
  let session = null;
  try {
    const sessionPromise = supabase.auth.getSession().then(({ data }) => data.session);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session check timed out')), 3000)
    );
    session = await Promise.race([sessionPromise, timeoutPromise]);
    console.log('📂 [Debug] Supabase session checked:', session ? 'Active Session Found' : 'NO SESSION - Redirecting to index.html');
  } catch (err) {
    console.warn('📂 [Debug] Supabase session check failed or timed out:', err);
    // Attempt fallback to cached local storage session
    const cachedUser = localStorage.getItem('maya_current_user');
    if (cachedUser) {
      console.log('📂 [Debug] Fallback: Found cached user in localStorage. App will proceed.');
      const parsed = JSON.parse(cachedUser);
      session = {
        user: {
          id: parsed.id,
          email: parsed.email,
          user_metadata: { name: parsed.name },
          created_at: parsed.created_at
        }
      };
    }
  }

  if (!session) {
    // If not logged in, clear storage and redirect to index.html immediately
    localStorage.removeItem('maya_current_user');
    window.location.href = '/index.html';
    return;
  }

  // Ensure localStorage is synced with session
  let currentUser = getCurrentUser();
  if (!currentUser) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        currentUser = {
          id: session.user.id,
          name: profile.name,
          email: profile.email,
          plan: profile.plan,
          generations_limit: profile.generations_limit,
          generations_used: profile.generations_used,
          gemini_api_key: profile.gemini_api_key,
          created_at: profile.created_at
        };
      } else {
        currentUser = {
          id: session.user.id,
          name: session.user.user_metadata?.name || 'Yeni Kullanıcı',
          email: session.user.email,
          plan: 'free',
          generations_limit: 5,
          generations_used: 0,
          created_at: session.user.created_at
        };
      }
      localStorage.setItem('maya_current_user', JSON.stringify(currentUser));
    } catch (e) {
      console.error('Failed to sync profile on app load:', e);
      currentUser = {
        id: session.user.id,
        name: session.user.user_metadata?.name || 'Yeni Kullanıcı',
        email: session.user.email,
        plan: 'free',
        generations_limit: 5,
        generations_used: 0,
        created_at: session.user.created_at
      };
      localStorage.setItem('maya_current_user', JSON.stringify(currentUser));
    }
  }

  // State Variables
  let selectedFile = null;
  let activeMetadata = null; // Holds currently active generation metadata

  // 2. DOM Elements & Navigation Toggles
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  const views = document.querySelectorAll('.dashboard-view');
  
  // Update view routing
  function switchView(viewId) {
    views.forEach(v => v.classList.remove('active'));
    sidebarItems.forEach(i => i.classList.remove('active'));

    const targetView = document.getElementById(`view-${viewId}`);
    const targetMenuItem = document.querySelector(`.sidebar-item[data-view="${viewId}"]`);

    if (targetView && targetMenuItem) {
      targetView.classList.add('active');
      targetMenuItem.classList.add('active');
    }
    
    // Execute specific view loaders
    if (viewId === 'dashboard') {
      loadDashboardHome();
    } else if (viewId === 'history') {
      loadHistoryTable();
    } else if (viewId === 'export') {
      loadExportTable();
    } else if (viewId === 'account') {
      loadAccountSettings();
    } else if (viewId === 'billing') {
      loadBillingSettings();
    }
  }

  // Sidebar Menu Clicks
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewId = item.getAttribute('data-view');
      switchView(viewId);
    });
  });

  // Logout Trigger
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      logout();
      showToast(t('toast.logoutSuccess'), 'success');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1000);
    });
  }

  // Redirect to History page link on Dashboard Home
  const viewAllHistoryBtn = document.getElementById('view-all-history-btn');
  if (viewAllHistoryBtn) {
    viewAllHistoryBtn.addEventListener('click', () => {
      switchView('history');
    });
  }

  // Handle URL Query Params or SessionStorage fallback on Load
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const paymentParam = urlParams.get('payment');
  
  let selectPlanParam = urlParams.get('selectPlan');
  let cycleParam = urlParams.get('cycle');

  // Check sessionStorage fallback if redirecting without parameters (e.g. after login/signup)
  if (!selectPlanParam) {
    selectPlanParam = sessionStorage.getItem('pending_plan');
    cycleParam = sessionStorage.getItem('pending_cycle');
    
    // Clear sessionStorage so it doesn't trigger repeatedly
    sessionStorage.removeItem('pending_plan');
    sessionStorage.removeItem('pending_cycle');
  } else {
    // Clear sessionStorage just in case it was set
    sessionStorage.removeItem('pending_plan');
    sessionStorage.removeItem('pending_cycle');
  }

  if (!cycleParam) {
    cycleParam = 'monthly';
  }

  if (paymentParam === 'success') {
    showToast(t('toast.paymentSuccess'), 'success');
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Periodically check Supabase profiles table for plan update (webhook lag handler)
    let checkCount = 0;
    const checkInterval = setInterval(async () => {
      checkCount++;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profile && (profile.plan !== currentUser.plan || checkCount > 5)) {
          clearInterval(checkInterval);
          currentUser = {
            id: session.user.id,
            name: profile.name,
            email: profile.email,
            plan: profile.plan,
            generations_limit: profile.generations_limit,
            generations_used: profile.generations_used,
            gemini_api_key: profile.gemini_api_key,
            created_at: profile.created_at
          };
          localStorage.setItem('maya_current_user', JSON.stringify(currentUser));
          updateSidebarProfile();
          loadDashboardHome();
          loadBillingSettings();
          showToast(t('toast.accountUpdated'), 'success');
        }
      } catch (e) {
        console.error('Failed to sync profile after payment:', e);
      }
    }, 1000);
  } else if (paymentParam === 'cancel') {
    showToast(t('toast.paymentCancelled'), 'warning');
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (tabParam) {
    switchView(tabParam);
    if (tabParam === 'billing' && selectPlanParam) {
      handlePlanUpgrade(selectPlanParam, cycleParam);
    }
  } else if (selectPlanParam) {
    // Switch to billing view and start checkout
    switchView('billing');
    handlePlanUpgrade(selectPlanParam, cycleParam);
  } else {
    // Default view
    switchView('dashboard');
  }

  // 3. User Interface Profiles Loader
  function updateSidebarProfile() {
    const user = getCurrentUser();
    if (!user) return;

    // Set Initials in avatar
    const avatar = document.getElementById('sidebar-avatar');
    if (avatar) {
      const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      avatar.textContent = initials;
    }

    // Set text names and subscription details
    const nameEl = document.getElementById('sidebar-user-name');
    const planEl = document.getElementById('sidebar-user-plan');
    if (nameEl) nameEl.textContent = user.name;
    if (planEl) planEl.textContent = `${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} ${t('dashboard.sidebar.accountSuffix')}`;
  }
  
  updateSidebarProfile();

  // Load Dashboard statistics & recent lists
  async function loadDashboardHome() {
    updateSidebarProfile();
    const user = getCurrentUser();
    if (!user) return;

    const history = await getUserHistory(user.id);
    const logs = await getActivityLogs(user.id);

    // Update stats cards
    document.getElementById('stats-total-gen').textContent = history.length;
    
    const limitVal = user.generations_limit === 999999 ? t('dashboard.home.unlimited') : user.generations_limit;
    document.getElementById('stats-credits').textContent = user.generations_limit === 999999 ? t('dashboard.home.unlimited') : user.generations_limit - user.generations_used;
    document.getElementById('stats-credits-change').textContent = `${user.generations_used} / ${limitVal} limit`;
    document.getElementById('stats-plan').textContent = user.plan;

    const lastLog = logs.length > 0 ? translateActivityLog(logs[0].action) : t('common.noData');
    document.getElementById('stats-activity').textContent = lastLog;

    // Load recent table (limit to 5)
    const recentTbody = document.getElementById('recent-generations-tbody');
    recentTbody.innerHTML = '';
    
    if (history.length === 0) {
      recentTbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 40px; color: var(--color-text-muted);">${t('dashboard.home.noHistory')}</td></tr>`;
      return;
    }

    history.slice(0, 5).forEach(row => {
      const tr = document.createElement('tr');
      const formattedDate = new Date(row.upload_date).toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'long', year: 'numeric' });
      
      tr.innerHTML = `
        <td class="thumbnail-cell">
          <img src="${row.image_url}" class="table-thumbnail" alt="thumbnail">
        </td>
        <td>
          <div class="table-title">${row.title}</div>
          <div style="font-size: 11px; color: var(--color-text-muted); max-width: 350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${row.description}</div>
        </td>
        <td>${formattedDate}</td>
        <td><span class="table-badge">${getCategoryName(row.category)}</span></td>
        <td class="table-actions">
          <button class="btn btn-secondary btn-review" data-id="${row.id}" style="padding: 6px 12px; font-size: 11px;">${t('dashboard.table.review')}</button>
        </td>
      `;
      recentTbody.appendChild(tr);
    });

    // Add click listeners to review buttons
    recentTbody.querySelectorAll('.btn-review').forEach(btn => {
      btn.addEventListener('click', () => {
        const resultId = btn.getAttribute('data-id');
        viewResultDetails(resultId);
      });
    });
  }

  // Help translate category key to display name
  function getCategoryName(key) {
    return t(`categories.${key}`) || key;
  }

  // 4. CATEGORIES DROPDOWN INITIALIZATION
  const categorySelector = document.getElementById('generator-category');
  if (categorySelector) {
    categorySelector.innerHTML = '';
    const allCategoriesMap = {};
    getCategories().forEach(c => { allCategoriesMap[c.key] = t(`categories.${c.key}`) || c.name; });
    getCategories().forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.key;
      option.textContent = allCategoriesMap[cat.key];
      categorySelector.appendChild(option);
    });
  }

  // 5. FILE UPLOADING FLOW & DRAG AND DROP
  const quickDropzone = document.getElementById('quick-dropzone');
  const mainDropzone = document.getElementById('main-dropzone');
  const quickFileInput = document.getElementById('quick-file-input');
  const mainFileInput = document.getElementById('main-file-input');

  // Drag and Drop listeners
  ['dragenter', 'dragover'].forEach(eventName => {
    [quickDropzone, mainDropzone].forEach(dropzone => {
      if (dropzone) {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        }, false);
      }
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    [quickDropzone, mainDropzone].forEach(dropzone => {
      if (dropzone) {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
        }, false);
      }
    });
  });

  // Drop execution
  [quickDropzone, mainDropzone].forEach((dropzone, index) => {
    if (dropzone) {
      dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
          handleSelectedFile(files[0]);
        }
      });
    }
  });

  // File Inputs
  if (quickFileInput) {
    quickFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleSelectedFile(e.target.files[0]);
    });
  }
  if (mainFileInput) {
    mainFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleSelectedFile(e.target.files[0]);
    });
  }

  function handleSelectedFile(file) {
    console.log('📂 [Debug] handleSelectedFile called for file:', file ? file.name : 'null', 'Type:', file ? file.type : 'unknown');
    if (!file.type.startsWith('image/')) {
      showToast(t('toast.onlyImages'), 'warning');
      return;
    }
    
    selectedFile = file;
    // Auto-switch to Upload view to process
    switchView('upload');
    startSimulatedGeneration();
  }

  // Real or Simulated AI Analyzer Flow
  function startSimulatedGeneration() {
    console.log('📂 [Debug] startSimulatedGeneration triggered, selectedFile:', selectedFile ? selectedFile.name : 'null');
    if (!selectedFile) return;

    const user = getCurrentUser();
    console.log('📂 [Debug] Current User retrieved:', user);

    if (!user) {
      console.error('📂 [Debug] User object is null! Checking session...');
      showToast(t('toast.sessionNotFound'), 'error');
      return;
    }

    // Check credits
    if (user.generations_used >= user.generations_limit) {
      showToast(t('toast.limitReached'), 'warning');
      switchView('billing');
      return;
    }

    const dropzone = document.getElementById('main-dropzone');
    const loading = document.getElementById('generator-loading');
    const results = document.getElementById('generator-results');

    // Show loading spinner
    dropzone.style.display = 'none';
    loading.style.display = 'flex';
    results.style.display = 'none';

    // Parse image file to display preview
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('result-preview-img').src = e.target.result;
      
      const categoryKey = categorySelector.value;
      const userKey = user.gemini_api_key || '';

      // Real API call via secure backend proxy
      generateGeminiMetadata(e.target.result, categoryKey, userKey, user.plan, getCurrentLanguage())
        .then(generatedData => {
          // Save to Database
          saveGeneration(user.id, e.target.result, generatedData).then(() => {
            // Load details to display
            activeMetadata = generatedData;
            populateResultsView(generatedData);
            
            // Hide simulation warning banner
            const warningBanner = document.getElementById('simulation-warning-banner');
            if (warningBanner) warningBanner.style.display = 'none';

            // Adjust screens
            loading.style.display = 'none';
            results.style.display = 'block';
            
            showToast(t('toast.analysisComplete'), 'success');
          }).catch(dbErr => {
            showToast(t('toast.dbSaveError', { error: dbErr.message }), 'error');
            loading.style.display = 'none';
            dropzone.style.display = 'flex';
          });
        })
        .catch(err => {
          console.warn('📂 [Debug] Gemini API failed, using simulation fallback:', err);
          
          showToast(t('toast.noApiKey'), 'warning');
          if (err.message && (err.message.includes('API key not valid') || err.message.includes('invalid') || err.message.includes('API_KEY_INVALID') || err.message.includes('API key'))) {
            showToast(t('toast.invalidApiKey'), 'warning');
          } else if (err.message && err.message.includes('quota')) {
            showToast(t('toast.quotaExceeded'), 'warning');
          }
          
          setTimeout(() => {
            const generatedData = generateAIData(categoryKey, selectedFile.name, user.plan, getCurrentLanguage());
            
            // Save to Database
            saveGeneration(user.id, e.target.result, generatedData).then(() => {
              // Load details to display
              activeMetadata = generatedData;
              populateResultsView(generatedData);
              
              // Show simulation warning banner
              const warningBanner = document.getElementById('simulation-warning-banner');
              if (warningBanner) warningBanner.style.display = 'block';

              // Adjust screens
              loading.style.display = 'none';
              results.style.display = 'block';
              
              showToast(t('toast.simulationComplete'), 'success');
            }).catch(dbErr => {
              showToast(t('toast.dbSaveError', { error: dbErr.message }), 'error');
              loading.style.display = 'none';
              dropzone.style.display = 'flex';
            });
          }, 1500);
        });
    };
    reader.readAsDataURL(selectedFile);
  }

  // Fill in the metadata boxes on results page
  function populateResultsView(data) {
    // Category label
    document.getElementById('result-category-label').textContent = `${t('results.categoryPrefix')}: ${getCategoryName(data.category)}`;

    // Adobe Stock
    document.getElementById('adobe-title').textContent = data.adobe.title;
    document.getElementById('adobe-keywords').textContent = data.adobe.keywords;
    renderTagsContainer('adobe-keywords-tags', data.adobe.keywords);

    // Shutterstock
    document.getElementById('shutterstock-title').textContent = data.shutterstock.title;
    document.getElementById('shutterstock-desc').textContent = data.shutterstock.description;
    document.getElementById('shutterstock-keywords').textContent = data.shutterstock.keywords;
    renderTagsContainer('shutterstock-keywords-tags', data.shutterstock.keywords);

    // Freepik
    document.getElementById('freepik-title').textContent = data.freepik.title;
    document.getElementById('freepik-keywords').textContent = data.freepik.keywords;
    renderTagsContainer('freepik-keywords-tags', data.freepik.keywords);

    // Vecteezy
    document.getElementById('vecteezy-title').textContent = data.vecteezy.title;
    document.getElementById('vecteezy-desc').textContent = data.vecteezy.description;
    document.getElementById('vecteezy-keywords').textContent = data.vecteezy.keywords;
    renderTagsContainer('vecteezy-keywords-tags', data.vecteezy.keywords);

    // E-Ticaret / Ürün Satış
    document.getElementById('ecommerce-title').textContent = data.ecommerce.title;
    document.getElementById('ecommerce-desc').textContent = data.ecommerce.description;
    document.getElementById('ecommerce-keywords').textContent = data.ecommerce.tags;
    renderTagsContainer('ecommerce-keywords-tags', data.ecommerce.tags);

    // Diğer / Genel
    document.getElementById('general-title').textContent = data.title;
    document.getElementById('general-desc').textContent = data.description;
    document.getElementById('general-keywords').textContent = data.keywords;
    renderTagsContainer('general-keywords-tags', data.keywords);
  }

  function renderTagsContainer(containerId, commaString) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    commaString.split(',').forEach(tag => {
      const span = document.createElement('span');
      span.className = 'keyword-tag';
      span.textContent = tag.trim();
      container.appendChild(span);
    });
  }

  // Platform result tab toggling
  const platformTabs = document.querySelectorAll('.platform-tab');
  platformTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const platform = tab.getAttribute('data-platform');
      
      // Toggles tab class
      platformTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Toggles pane class
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      document.getElementById(`pane-${platform}`).classList.add('active');
    });
  });

  // Reset/Reset Upload Button
  const resetBtn = document.getElementById('reset-generator-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      selectedFile = null;
      activeMetadata = null;
      document.getElementById('main-dropzone').style.display = 'flex';
      document.getElementById('generator-loading').style.display = 'none';
      document.getElementById('generator-results').style.display = 'none';
      if (mainFileInput) mainFileInput.value = '';
    });
  }

  // 6. COPY TO CLIPBOARD INTEGRATION
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const box = document.getElementById(targetId);
      if (!box) return;

      const text = box.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          ${t('common.copied')}
        `;
        showToast(t('toast.copiedToClipboard'), 'success');
        
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      }).catch(err => {
        showToast(t('toast.copyFailed'), 'error');
      });
    });
  });

  // Historical review detail view
  async function viewResultDetails(resultId) {
    const user = getCurrentUser();
    const history = await getUserHistory(user.id);
    const item = history.find(h => h.id === resultId);
    if (!item) return;

    switchView('upload');
    
    // Set UI preview
    document.getElementById('result-preview-img').src = item.image_url;
    
    // Reconstruct full platform datasets for displaying
    const fullData = {
      category: item.category,
      title: item.title,
      description: item.description,
      keywords: item.keywords,
      tags: item.tags,
      
      adobe: {
        title: item.title,
        keywords: item.keywords.split(', ').slice(0, 30).join(', ')
      },
      shutterstock: {
        title: `${item.title} - ${t('results.stockPhotoSuffix')}`,
        description: `${item.description} ${t('results.highResCommercial')}`,
        keywords: item.keywords.split(', ').concat([t('results.stockKeyword'), 'shutterstock', t('results.highRes')]).slice(0, 50).join(', ')
      },
      freepik: {
        title: item.title.toLowerCase(),
        keywords: item.keywords.split(', ').map(k => k.toLowerCase()).slice(0, 25).join(', ')
      },
      vecteezy: {
        title: item.title,
        description: item.description,
        keywords: item.keywords.split(', ').slice(0, 20).join(', ')
      },
      ecommerce: {
        title: `${item.title} | ${t('results.ecommerceProductSuffix')}`,
        description: item.description,
        tags: item.tags.split(', ').slice(0, 13).join(', ')
      }
    };
    
    activeMetadata = fullData;
    populateResultsView(fullData);
    
    // Toggle screens
    document.getElementById('main-dropzone').style.display = 'none';
    document.getElementById('generator-loading').style.display = 'none';
    document.getElementById('generator-results').style.display = 'block';
  }

  // 7. GEÇMİŞ (HISTORY) CONTROLLER
  const historySearch = document.getElementById('history-search');
  const historyFilterCategory = document.getElementById('history-filter-category');

  // Load options inside filters
  if (historyFilterCategory) {
    historyFilterCategory.innerHTML = `<option value="">${t('history.allCategories')}</option>`;
    getCategories().forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.key;
      option.textContent = cat.name;
      historyFilterCategory.appendChild(option);
    });
  }

  async function loadHistoryTable() {
    const user = getCurrentUser();
    const history = await getUserHistory(user.id);
    const tbody = document.getElementById('history-table-tbody');
    tbody.innerHTML = '';

    const searchQuery = historySearch ? historySearch.value.toLowerCase() : '';
    const selectedCategory = historyFilterCategory ? historyFilterCategory.value : '';

    const filtered = history.filter(row => {
      const matchesSearch = row.title.toLowerCase().includes(searchQuery) || 
                            row.description.toLowerCase().includes(searchQuery) ||
                            row.keywords.toLowerCase().includes(searchQuery);
      const matchesCategory = selectedCategory === '' || row.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 40px; color: var(--color-text-muted);">${t('history.noResults')}</td></tr>`;
      return;
    }

    filtered.forEach(row => {
      const tr = document.createElement('tr');
      const formattedDate = new Date(row.upload_date).toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'long', year: 'numeric' });
      
      tr.innerHTML = `
        <td class="thumbnail-cell">
          <img src="${row.image_url}" class="table-thumbnail" alt="thumbnail">
        </td>
        <td>
          <div class="table-title">${row.title}</div>
          <div style="font-size: 11px; color: var(--color-text-muted); max-width: 450px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${row.description}</div>
        </td>
        <td>${formattedDate}</td>
        <td><span class="table-badge">${getCategoryName(row.category)}</span></td>
        <td class="table-actions">
          <button class="btn btn-secondary btn-review" data-id="${row.id}" style="padding: 6px 12px; font-size: 11px;"><span>${t('dashboard.table.review')}</span></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-review').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        viewResultDetails(id);
      });
    });
  }

  // Trigger filters
  if (historySearch) historySearch.addEventListener('input', loadHistoryTable);
  if (historyFilterCategory) historyFilterCategory.addEventListener('change', loadHistoryTable);

  // 8. DIŞA AKTAR (EXPORT) CONTROLLER
  const exportSelectAll = document.getElementById('export-select-all');
  const downloadCsvBtn = document.getElementById('download-csv-btn');
  let selectedExportIds = [];

  async function loadExportTable() {
    const user = getCurrentUser();
    const history = await getUserHistory(user.id);
    const tbody = document.getElementById('export-table-tbody');
    tbody.innerHTML = '';
    selectedExportIds = [];
    if (exportSelectAll) exportSelectAll.checked = false;
    updateSelectedExportCount();

    if (history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 40px; color: var(--color-text-muted);">${t('export.noExportData')}</td></tr>`;
      return;
    }

    history.forEach(row => {
      const tr = document.createElement('tr');
      const formattedDate = new Date(row.upload_date).toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'long', year: 'numeric' });
      
      tr.innerHTML = `
        <td class="checkbox-cell">
          <input type="checkbox" class="export-row-checkbox" data-id="${row.id}">
        </td>
        <td class="thumbnail-cell">
          <img src="${row.image_url}" class="table-thumbnail" alt="thumbnail">
        </td>
        <td>
          <div class="table-title">${row.title}</div>
        </td>
        <td>${formattedDate}</td>
        <td><span class="table-badge">${getCategoryName(row.category)}</span></td>
      `;
      tbody.appendChild(tr);
    });

    // Row checkbox listener
    tbody.querySelectorAll('.export-row-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-id');
        if (cb.checked) {
          selectedExportIds.push(id);
        } else {
          selectedExportIds = selectedExportIds.filter(item => item !== id);
        }
        updateSelectedExportCount();
      });
    });
  }

  if (exportSelectAll) {
    exportSelectAll.addEventListener('change', () => {
      const checkboxes = document.querySelectorAll('.export-row-checkbox');
      selectedExportIds = [];
      
      checkboxes.forEach(cb => {
        cb.checked = exportSelectAll.checked;
        const id = cb.getAttribute('data-id');
        if (cb.checked) {
          selectedExportIds.push(id);
        }
      });
      updateSelectedExportCount();
    });
  }

  function updateSelectedExportCount() {
    const countEl = document.getElementById('export-selected-count');
    if (countEl) countEl.textContent = selectedExportIds.length;
  }

  // BUILD CSV EXPORT DOWNLOAD DYNAMICS
  if (downloadCsvBtn) {
    downloadCsvBtn.addEventListener('click', async () => {
      if (selectedExportIds.length === 0) {
        showToast(t('toast.selectExportItems'), 'warning');
        return;
      }

      const user = getCurrentUser();
      const history = await getUserHistory(user.id);
      const itemsToExport = history.filter(h => selectedExportIds.includes(h.id));
      
      const format = document.querySelector('input[name="export-format"]:checked').value;
      let csvContent = "";
      
      // Determine CSV structures based on target marketplaces
      if (format === 'adobe') {
        // Adobe Stock format: Filename,Title,Keywords
        csvContent += "Filename,Title,Keywords\r\n";
        itemsToExport.forEach(item => {
          const rowTitle = `"${item.title.replace(/"/g, '""')}"`;
          const rowKeywords = `"${item.keywords.split(', ').slice(0, 30).join(', ').replace(/"/g, '""')}"`;
          csvContent += `image_${item.id}.jpg,${rowTitle},${rowKeywords}\r\n`;
        });
      } 
      else if (format === 'shutterstock') {
        // Shutterstock format: Filename,Description,Keywords,Categories
        csvContent += "Filename,Description,Keywords,Categories\r\n";
        itemsToExport.forEach(item => {
          const rowDesc = `"${item.description.replace(/"/g, '""')}"`;
          const rowKeywords = `"${item.keywords.replace(/"/g, '""')}"`;
          csvContent += `image_${item.id}.jpg,${rowDesc},${rowKeywords},Technology\r\n`;
        });
      } 
      else if (format === 'freepik') {
        // Freepik format: Title,Keywords
        csvContent += "Title,Keywords\r\n";
        itemsToExport.forEach(item => {
          const rowTitle = `"${item.title.toLowerCase().replace(/"/g, '""')}"`;
          const rowKeywords = `"${item.keywords.toLowerCase().replace(/"/g, '""')}"`;
          csvContent += `${rowTitle},${rowKeywords}\r\n`;
        });
      } 
      else if (format === 'vecteezy') {
        // Vecteezy format: Title,Description,Keywords
        csvContent += "Title,Description,Keywords\r\n";
        itemsToExport.forEach(item => {
          const rowTitle = `"${item.title.replace(/"/g, '""')}"`;
          const rowDesc = `"${item.description.replace(/"/g, '""')}"`;
          const rowKeywords = `"${item.keywords.replace(/"/g, '""')}"`;
          csvContent += `${rowTitle},${rowDesc},${rowKeywords}\r\n`;
        });
      } 
      else if (format === 'ecommerce') {
        // Ecommerce / Online product sales format: Title,Description,Tags,Price,SKU
        csvContent += "Title,Description,Tags,Price,SKU\r\n";
        itemsToExport.forEach(item => {
          const rowTitle = `"${(item.title + ' | ' + t('results.ecommerceProductSuffix')).replace(/"/g, '""')}"`;
          const rowDesc = `"${item.description.replace(/"/g, '""')}"`;
          const rowTags = `"${item.tags.replace(/"/g, '""')}"`;
          csvContent += `${rowTitle},${rowDesc},${rowTags},299.90,SKU_${item.id}\r\n`;
        });
      }

      // Download Trigger
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for excel Turkish support
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `maya_export_${format}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast(t('toast.csvSuccess'), 'success');
    });
  }

  // 9. PROFILE MANAGEMENT
  const profileForm = document.getElementById('profile-update-form');
  
  function loadAccountSettings() {
    const user = getCurrentUser();
    if (!user) return;

    document.getElementById('profile-name').value = user.name;
    document.getElementById('profile-email').value = user.email;
    document.getElementById('profile-password').value = '';
    document.getElementById('profile-password-confirm').value = '';
    document.getElementById('profile-gemini-key').value = user.gemini_api_key || '';
    
    // Set initials in large avatar circle
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('profile-avatar-display').textContent = initials;
  }

  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('profile-name').value;
      const email = document.getElementById('profile-email').value;
      const pwd = document.getElementById('profile-password').value;
      const pwdConfirm = document.getElementById('profile-password-confirm').value;
      const geminiApiKey = document.getElementById('profile-gemini-key').value;

      if (pwd !== '' && pwd !== pwdConfirm) {
        showToast(t('toast.passwordMismatch'), 'error');
        return;
      }

      try {
        await updateProfile(name, email, pwd, geminiApiKey);
        showToast(t('toast.profileUpdated'), 'success');
        updateSidebarProfile();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // 10. BILLING & SUBSCRIPTIONS CONTROLLER
  function loadBillingSettings() {
    const user = getCurrentUser();
    if (!user) return;

    const limitVal = user.generations_limit === 999999 ? t('dashboard.home.unlimited') : user.generations_limit;
    document.getElementById('billing-plan-title').textContent = `${user.plan.toUpperCase()} PLAN`;
    document.getElementById('billing-limit-text').textContent = `${user.generations_used} / ${limitVal} ${t('billing.imagesUnit')}`;
    
    // Update progress bar
    const progressFill = document.getElementById('billing-limit-progress');
    if (progressFill) {
      const percentage = user.generations_limit === 999999 ? 100 : Math.min(100, (user.generations_used / user.generations_limit) * 100);
      progressFill.style.width = `${percentage}%`;
    }

    // Set highlights on selected card
    ['free', 'starter', 'pro', 'studio'].forEach(plan => {
      const card = document.getElementById(`billing-card-${plan}`);
      if (!card) return;
      let btn = card.querySelector('.change-plan-btn') || card.querySelector('.vip-support-btn');
      
      if (user.plan === plan) {
        card.classList.add('popular');
        
        if (plan === 'studio') {
          // Clone to strip existing event listeners and bind mailto action
          const newBtn = btn.cloneNode(true);
          newBtn.textContent = t('billing.vipSupport');
          newBtn.disabled = false;
          newBtn.className = 'btn btn-primary vip-support-btn';
          newBtn.style.backgroundColor = '#10B981'; // Emerald Green for support
          newBtn.style.borderColor = '#10B981';
          newBtn.style.color = '#FFFFFF';
          newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const subject = encodeURIComponent(t('billing.vipMailtoSubject'));
            const body = encodeURIComponent(t('billing.vipMailtoBody'));
            window.location.href = `mailto:support@mayasolutions.com?subject=${subject}&body=${body}`;
          });
          btn.replaceWith(newBtn);
        } else {
          btn.textContent = t('billing.currentPlanBtn');
          btn.disabled = true;
          btn.className = 'btn btn-primary change-plan-btn';
        }
        
        // Add badge
        if (!card.querySelector('.pricing-badge')) {
          const badge = document.createElement('span');
          badge.className = 'pricing-badge';
          badge.textContent = t('pricing.activePlan');
          card.appendChild(badge);
        }
      } else {
        card.classList.remove('popular');
        
        // If it was a VIP button, clone it back to make it a normal button
        if (btn.classList.contains('vip-support-btn')) {
          const newBtn = btn.cloneNode(true);
          newBtn.textContent = t('billing.switchToPlan', { plan: plan.charAt(0).toUpperCase() + plan.slice(1) });
          newBtn.disabled = false;
          newBtn.className = 'btn btn-secondary change-plan-btn';
          newBtn.style.backgroundColor = '';
          newBtn.style.borderColor = '';
          newBtn.style.color = '';
          newBtn.addEventListener('click', () => {
            handlePlanUpgrade(plan);
          });
          btn.replaceWith(newBtn);
        } else {
          btn.textContent = t('billing.switchToPlan', { plan: plan.charAt(0).toUpperCase() + plan.slice(1) });
          btn.disabled = false;
          btn.className = 'btn btn-secondary change-plan-btn';
        }
        
        const badge = card.querySelector('.pricing-badge');
        if (badge) badge.remove();
      }
    });
  }

  // Handle plan upgrade action
  async function handlePlanUpgrade(plan, billingCycle = 'monthly') {
    const user = getCurrentUser();
    if (!user) {
      showToast(t('toast.loginRequired'), 'error');
      return;
    }

    if (plan === 'free') {
      try {
        const { updateSubscription } = await import('./auth.js');
        await updateSubscription('free');
        showToast(t('toast.planUpdatedSuccess') || 'Planınız başarıyla güncellendi.', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        showToast(err.message, 'error');
      }
      return;
    }

    try {
      showToast(t('toast.paymentRedirect'), 'success');
      
      const response = await fetch('/api/payment/lemon/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan: plan,
          userId: user.id,
          billingCycle: billingCycle,
          successUrl: window.location.origin + '/app/?payment=success',
          cancelUrl: window.location.origin + '/app/?payment=cancel'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || t('toast.paymentSessionError'));
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(t('toast.invalidPaymentUrl'));
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Add click listeners to change subscription buttons
  const planButtons = document.querySelectorAll('.change-plan-btn');
  planButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan');
      handlePlanUpgrade(plan);
    });
  });

  // 11. GLOBAL TOAST GENERATOR
  function showToast(message, type = 'success') {
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

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'toast-out 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards';
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, 3000);
  }
  // Dashboard Theme Toggle Logic
  const dashThemeToggleBtn = document.getElementById('dashboard-theme-toggle');
  if (dashThemeToggleBtn) {
    dashThemeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('maya-theme', newTheme);
    });
  }

  // Apply i18n translations to dashboard DOM
  applyTranslations();

  // Create language switcher in sidebar footer
  const sidebarFooterActions = document.querySelector('.sidebar .footer-actions');
  if (sidebarFooterActions && !sidebarFooterActions.querySelector('.lang-switcher')) {
    createLanguageSwitcher(sidebarFooterActions, 'prepend');
  }

  // Listen for language changes
  window.addEventListener('languageChanged', () => {
    applyTranslations();
    updateSEOMeta();
    updateHtmlLang();
    // Update sidebar plan label
    const sidebarPlanEl = document.getElementById('sidebar-user-plan');
    const user = getCurrentUser();
    if (user && sidebarPlanEl) {
      sidebarPlanEl.textContent = `${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} ${t('dashboard.sidebar.accountSuffix')}`;
    }
    // Refresh category select options
    const catSelect = document.getElementById('generator-category');
    if (catSelect) {
      const categories = getCategories();
      Array.from(catSelect.options).forEach((option, i) => {
        const cat = categories.find(c => c.key === option.value);
        if (cat) option.textContent = t(`categories.${cat.key}`) || cat.name;
      });
    }
    // Refresh history filter category options
    const historyFilter = document.getElementById('history-filter-category');
    if (historyFilter) {
      const firstOpt = historyFilter.querySelector('option[value=""]');
      if (firstOpt) firstOpt.textContent = t('history.allCategories');
      getCategories().forEach(cat => {
        const opt = historyFilter.querySelector(`option[value="${cat.key}"]`);
        if (opt) opt.textContent = t(`categories.${cat.key}`) || cat.name;
      });
    }
    // Refresh current view tables
    const activeView = document.querySelector('.dashboard-view.active');
    if (activeView) {
      const viewId = activeView.id.replace('view-', '');
      if (viewId === 'dashboard') loadDashboardHome();
      else if (viewId === 'history') loadHistoryTable();
      else if (viewId === 'export') loadExportTable();
      else if (viewId === 'billing') loadBillingSettings();
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
