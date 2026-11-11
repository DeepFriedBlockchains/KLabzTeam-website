(() => {
  const gallery = document.querySelector('#merch-gallery');
  if (!gallery) return;

  const categoryNav = document.querySelector('#merch-categories');
  const filterButtons = [...categoryNav.querySelectorAll('[data-filter]')];
  const cards = [...gallery.querySelectorAll('[data-category]')];
  const countByCategory = new Map();
  cards.forEach((card) => {
    const category = card.dataset.category;
    countByCategory.set(category, (countByCategory.get(category) || 0) + 1);
  });
  filterButtons.forEach((button) => {
    if (button.dataset.filter !== 'all' && !countByCategory.has(button.dataset.filter)) {
      button.hidden = true;
    }
    button.addEventListener('click', () => {
      const selected = button.dataset.filter;
      filterButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      cards.forEach((card) => {
        card.hidden = selected !== 'all' && card.dataset.category !== selected;
      });
    });
  });

  const preview = document.querySelector('#merch-preview');
  const previewImage = preview.querySelector('img');
  const previewCaption = preview.querySelector('figcaption');
  gallery.querySelectorAll('[data-preview]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const image = trigger.querySelector('img');
      previewImage.src = image.src;
      previewImage.alt = image.alt;
      previewCaption.textContent = trigger.dataset.preview;
      preview.showModal();
    });
  });
  preview.addEventListener('click', (event) => {
    if (event.target === preview) preview.close();
  });

  const requestDialog = document.querySelector('#merch-request-dialog');
  const requestForm = document.querySelector('#merch-request-form');
  const selectedDesign = requestForm.elements.design;
  const itemType = requestForm.elements.itemType;
  const formStatus = document.querySelector('#merch-request-status');
  const selectionConfirmation = document.querySelector('#merch-selection-confirmation');
  gallery.querySelectorAll('[data-request]').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('[data-category]');
      selectedDesign.value = card.dataset.design;
      itemType.value = card.dataset.itemType;
      selectionConfirmation.textContent = `${card.dataset.design} selected. Complete the details below to prepare an availability inquiry; this does not place an order.`;
      formStatus.textContent = '';
      requestDialog.showModal();
      selectedDesign.focus();
    });
  });
  requestDialog.addEventListener('click', (event) => {
    if (event.target === requestDialog) requestDialog.close();
  });
  requestForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!requestForm.reportValidity()) return;
    const data = new FormData(requestForm);
    const body = [
      'Kasquatch made-to-order merchandise inquiry',
      '',
      `Design: ${data.get('design')}`,
      `Item type: ${data.get('itemType')}`,
      `Requested size: ${data.get('size')}`,
      `Preferred color: ${data.get('color')}`,
      `Quantity: ${data.get('quantity')}`,
      `Customer name: ${data.get('name')}`,
      `Contact email: ${data.get('email')}`,
      `Notes or customization requests: ${data.get('notes') || 'None'}`,
      '',
      'This is an availability inquiry, not a confirmed order.'
    ].join('\n');
    const mailto = `mailto:contact@kasuallabz.xyz?subject=${encodeURIComponent(`Kasquatch merch inquiry — ${data.get('design')}`)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    formStatus.textContent = 'Your email app should open with this inquiry addressed to contact@kasuallabz.xyz. Send the email there to complete your request; no order is confirmed.';
  });
})();
