// VideoMarket - Main JavaScript

document.addEventListener('DOMContentLoaded', function () {

  // Auto-dismiss alerts after 5 seconds
  const autoDismissAlerts = document.querySelectorAll('.auto-dismiss');
  autoDismissAlerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      bsAlert.close();
    }, 5000);
  });

  // File upload preview
  const videoInputs = document.querySelectorAll('input[type="file"][accept*="video"]');
  videoInputs.forEach(input => {
    input.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;

      // Show file name
      let preview = this.nextElementSibling;
      if (!preview || !preview.classList.contains('file-preview')) {
        preview = document.createElement('div');
        preview.className = 'file-preview mt-2 small text-success';
        this.parentNode.insertBefore(preview, this.nextSibling);
      }

      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      preview.innerHTML = `<i class="bi bi-film"></i> Selected: <strong>${file.name}</strong> (${sizeMB} MB)`;

      // Warn if file is large
      if (file.size > 100 * 1024 * 1024) {
        preview.innerHTML += `<span class="text-warning ms-2"><i class="bi bi-exclamation-triangle"></i> Large file - upload may take a while</span>`;
      }
    });
  });

  // Form validation feedback
  const forms = document.querySelectorAll('form[novalidate]');
  forms.forEach(form => {
    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });

  // Budget vs wallet balance check on post-job form
  const budgetInput = document.getElementById('budget');
  if (budgetInput) {
    budgetInput.addEventListener('input', function () {
      const walletEl = document.querySelector('[data-wallet-balance]');
      if (!walletEl) return;
      const balance = parseFloat(walletEl.dataset.walletBalance) || 0;
      const budget = parseFloat(this.value) || 0;
      const warning = document.getElementById('budgetWarning');
      if (warning) {
        if (budget > balance) {
          warning.classList.remove('d-none');
        } else {
          warning.classList.add('d-none');
        }
      }
    });
  }

  // Confirm before destructive actions
  const confirmForms = document.querySelectorAll('[data-confirm]');
  confirmForms.forEach(el => {
    el.addEventListener('submit', function (e) {
      const msg = this.dataset.confirm || 'Are you sure?';
      if (!confirm(msg)) {
        e.preventDefault();
      }
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Tooltip initialization
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));

  // Toast helper function
  window.showToast = function (message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;
    toastContainer.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  };

  function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '1100';
    document.body.appendChild(container);
    return container;
  }

  // Number formatting helper
  window.formatCurrency = function (amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
});
