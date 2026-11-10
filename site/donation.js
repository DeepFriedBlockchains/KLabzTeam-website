(() => {
  const openButton = document.querySelector('#donation-open');
  const dialog = document.querySelector('#donation-dialog');
  const closeButton = document.querySelector('#donation-close');
  const choices = document.querySelector('#donation-choices');
  const walletName = document.querySelector('#donation-wallet-name');
  const walletNetwork = document.querySelector('#donation-wallet-network');
  const walletLogo = document.querySelector('#donation-wallet-logo');
  const walletAddress = document.querySelector('#donation-wallet-address');
  const addressRow = document.querySelector('#donation-address-row');
  const addressMissing = document.querySelector('#donation-address-missing');
  const qrFigure = document.querySelector('#donation-qr-figure');
  const qrImage = document.querySelector('#donation-qr');
  const copyButton = document.querySelector('#donation-copy');
  const copyStatus = document.querySelector('#donation-copy-status');

  if (!openButton || !dialog || !choices || typeof dialog.showModal !== 'function') return;

  const isConfiguredAddress = (wallet) => {
    if (!wallet || wallet.configured !== true || typeof wallet.address !== 'string') return false;
    const address = wallet.address.trim();
    return Boolean(address) && !/(?:placeholder|your(?:[_ -][a-z0-9]+)*[_ -]address|wallet[_ -]address|\btbd\b|\btodo\b|\bexample\b|\benter\b)/i.test(address);
  };

  const isLocalDonationAsset = (value) => typeof value === 'string' && /^\/assets\/donations\/[a-z0-9-]+\.svg$/i.test(value);
  let wallets = [];
  let selectedWallet = null;

  const buildChoice = (wallet) => {
    const button = document.createElement('button');
    button.className = 'donation-choice';
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `${wallet.name} (${wallet.symbol}) on the ${wallet.network}`);
    button.disabled = !isConfiguredAddress(wallet);

    const logoFrame = document.createElement('span');
    logoFrame.className = `donation-choice-logo donation-logo-${wallet.symbol.toLowerCase()}`;
    logoFrame.setAttribute('aria-hidden', 'true');
    if (isLocalDonationAsset(wallet.logo)) {
      const image = document.createElement('img');
      image.src = wallet.logo;
      image.alt = '';
      image.width = 28;
      image.height = 28;
      logoFrame.append(image);
    }

    const labels = document.createElement('span');
    labels.className = 'donation-choice-labels';
    const symbol = document.createElement('strong');
    symbol.textContent = wallet.symbol;
    const name = document.createElement('small');
    name.textContent = wallet.name;
    labels.append(symbol, name);
    button.append(logoFrame, labels);
    button.addEventListener('click', () => selectWallet(wallet));
    choices.append(button);
    return button;
  };

  const choiceButtons = new Map();

  const selectWallet = (wallet) => {
    selectedWallet = wallet;
    const available = isConfiguredAddress(wallet);
    const address = available ? wallet.address.trim() : '';
    const name = typeof wallet.name === 'string' ? wallet.name : 'Cryptocurrency';

    choiceButtons.forEach((button, item) => {
      button.setAttribute('aria-pressed', String(item === wallet));
    });

    walletName.textContent = `${name} (${wallet.symbol || ''})`;
    walletNetwork.textContent = wallet.network || '';
    walletAddress.textContent = address;
    addressRow.hidden = !available;
    addressMissing.hidden = available;
    addressMissing.textContent = `${name} donation address is not configured yet.`;
    copyButton.hidden = !available;
    copyButton.disabled = !available;
    copyStatus.textContent = '';

    if (isLocalDonationAsset(wallet.logo)) {
      walletLogo.src = wallet.logo;
      walletLogo.hidden = false;
      walletLogo.alt = '';
      walletLogo.parentElement.className = `donation-wallet-logo donation-logo-${String(wallet.symbol).toLowerCase()}`;
    } else {
      walletLogo.removeAttribute('src');
      walletLogo.hidden = true;
    }

    qrFigure.hidden = !available || !isLocalDonationAsset(wallet.qr);
    if (!qrFigure.hidden) {
      qrImage.hidden = false;
      qrImage.alt = `${name} QR code containing the ${wallet.network} donation address.`;
      qrImage.src = wallet.qr;
      qrImage.onerror = () => {
        qrFigure.hidden = true;
        qrImage.hidden = true;
        qrImage.removeAttribute('src');
      };
    } else {
      qrImage.hidden = true;
      qrImage.removeAttribute('src');
    }
  };

  const copyFallback = (text) => {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.setAttribute('aria-hidden', 'true');
    field.style.position = 'fixed';
    field.style.top = '0';
    field.style.left = '-9999px';
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  };

  copyButton.addEventListener('click', async () => {
    if (!isConfiguredAddress(selectedWallet)) return;
    const address = selectedWallet.address.trim();
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(address);
      } else if (!copyFallback(address)) {
        throw new Error('Clipboard unavailable');
      }
      copyStatus.textContent = `${selectedWallet.name} address copied.`;
    } catch {
      copyStatus.textContent = 'Copy unavailable. Select the address above and copy it manually.';
    }
  });

  openButton.addEventListener('click', () => {
    if (!dialog.open) dialog.showModal();
  });
  if (closeButton) closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  fetch('/donation-wallets.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error('Wallet configuration unavailable');
      return response.json();
    })
    .then((configuration) => {
      if (!configuration || !Array.isArray(configuration.wallets)) throw new Error('Invalid wallet configuration');
      wallets = configuration.wallets.filter((wallet) => wallet && typeof wallet.symbol === 'string');
      if (!wallets.length) return;

      wallets.forEach((wallet) => choiceButtons.set(wallet, buildChoice(wallet)));
      selectedWallet = wallets.find(isConfiguredAddress) || wallets[0];
      selectWallet(selectedWallet);
      openButton.hidden = false;
    })
    .catch(() => {
      // Keep the footer button hidden when the local wallet configuration cannot be loaded.
    });
})();
