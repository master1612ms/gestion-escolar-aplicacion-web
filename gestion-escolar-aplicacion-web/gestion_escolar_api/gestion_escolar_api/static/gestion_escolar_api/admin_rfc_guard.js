(function () {
  function sanitize(value) {
    return String(value || '').replace(/[^A-Za-z0-9]/g, '');
  }

  function wireField(field) {
    if (!field || field.dataset.rfcGuardAttached === '1') return;
    field.dataset.rfcGuardAttached = '1';
    field.setAttribute('autocomplete', 'off');
    field.setAttribute('spellcheck', 'false');
    field.setAttribute('inputmode', 'latin');
    field.setAttribute('pattern', '[A-Za-z0-9]+');
    field.setAttribute('title', 'Solo letras y números, sin espacios');

    field.addEventListener('keydown', function (event) {
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
      }
    });

    field.addEventListener('input', function () {
      const cleaned = sanitize(field.value);
      if (field.value !== cleaned) {
        field.value = cleaned;
      }
    });

    field.addEventListener('paste', function (event) {
      event.preventDefault();
      const text = event.clipboardData ? event.clipboardData.getData('text') : '';
      field.value = sanitize(text);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  function attach() {
    wireField(document.getElementById('id_rfc'));
    wireField(document.getElementById('id_curp'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }

  if (window.MutationObserver) {
    const observer = new MutationObserver(attach);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();