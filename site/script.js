(() => {
  document.documentElement.classList.add('js');

  const toggle = document.querySelector('.nav-toggle');
  const navigation = document.querySelector('.primary-nav');
  const navigationLinks = navigation ? navigation.querySelectorAll('a') : [];
  const currentYear = document.querySelector('#current-year');
  const launchToast = document.querySelector('#launch-toast');
  const copyTokenButton = document.querySelector('#copy-token-id');
  const tokenIdValue = document.querySelector('#token-id-value');
  const copyFeedback = document.querySelector('#copy-feedback');

  if (currentYear) {
    currentYear.textContent = String(new Date().getFullYear());
  }

  if (copyTokenButton && tokenIdValue && copyFeedback) {
    copyTokenButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(tokenIdValue.textContent.trim());
        copyFeedback.textContent = 'Token ID copied.';
      } catch {
        copyFeedback.textContent = 'Copy unavailable. Select the ID above to copy it.';
      }
    });
  }

  if (launchToast && !sessionStorage.getItem('kasquatch-launch-seen')) {
    sessionStorage.setItem('kasquatch-launch-seen', '1');
    const dismissButton = launchToast.querySelector('.launch-toast-close');
    const hideToast = () => {
      launchToast.classList.remove('is-visible');
      launchToast.setAttribute('aria-hidden', 'true');
    };
    window.setTimeout(() => {
      launchToast.setAttribute('aria-hidden', 'false');
      launchToast.classList.add('is-visible');
      window.setTimeout(hideToast, 8000);
    }, 1500);
    if (dismissButton) dismissButton.addEventListener('click', hideToast);
  }

  if (!toggle || !navigation) return;

  const closeNavigation = () => {
    toggle.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigationLinks.forEach((link) => link.addEventListener('click', closeNavigation));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNavigation();
  });
})();
