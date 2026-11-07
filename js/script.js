const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-navigation');

if (menuToggle && navigation) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      menuToggle.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
    }
  });
}

const revealElements = document.querySelectorAll('[data-reveal]');

if (revealElements.length && 'IntersectionObserver' in window
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.body.classList.add('motion-ready');
  revealElements.forEach((element) => revealObserver.observe(element));
}

document.querySelectorAll('.appointment-form').forEach((form) => {
  const endpoint = 'https://flat-queen-46b2.steopoaiea.workers.dev';
  let hasAttemptedSubmit = false;
  const requiredFields = Array.from(form.querySelectorAll('.form-error:not(.consent-error)')).map((warning) => ({
    input: warning.closest('.form-field').querySelector('input:not([type="checkbox"]), textarea'),
    warning
  }));
  const consent = form.querySelector('[name="consent"]');
  const consentWarning = form.querySelector('.consent-error');

  consent.addEventListener('change', () => {
    if (consent.checked) {
      consentWarning.hidden = true;
      consent.removeAttribute('aria-invalid');
    }
  });

  const updateWarning = ({ input, warning }) => {
    const isEmpty = !input.value.trim();
    const isInvalidName = input.name === 'Nume' && !isEmpty && input.value.trim().split(/\s+/).length < 2;
    const normalizedPhone = input.value.replace(/[\s().-]/g, '');
    const isInvalidPhone = input.name === 'Telefon' && !isEmpty
      && !/^0[237]\d{8}$/.test(normalizedPhone);
    const isInvalidEmail = input.type === 'email' && !isEmpty
      && (input.validity.typeMismatch || input.validity.patternMismatch);
    warning.textContent = input.name === 'Telefon'
      ? 'Introdu un număr de telefon valid.'
      : isEmpty
        ? `Adaugă ${input.name === 'Nume' ? 'numele' : input.name === 'Mesaj' ? 'mesajul' : 'adresa de e-mail'}.`
      : isInvalidEmail
        ? 'Introdu o adresă de e-mail validă.'
      : isInvalidName
        ? 'Introdu numele și prenumele.'
        : '';
    warning.hidden = !isEmpty && !isInvalidName && !isInvalidPhone && !isInvalidEmail;
    const hasError = isEmpty || isInvalidName || isInvalidPhone || isInvalidEmail;
    if (hasError && (!isEmpty || hasAttemptedSubmit)) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
    return hasError;
  };

  requiredFields.forEach(({ input, warning }) => {
    input.addEventListener('input', () => {
      if (hasAttemptedSubmit || input.type === 'email') {
        updateWarning({ input, warning });
      }
    });

    if (input.type === 'email') {
      input.addEventListener('blur', () => {
        if (input.value.trim()) {
          updateWarning({ input, warning });
        }
      });
    }
  });

  form.addEventListener('submit', (event) => {
    hasAttemptedSubmit = true;
    consentWarning.hidden = true;
    consent.removeAttribute('aria-invalid');
    let firstEmptyInput;

    requiredFields.forEach((field) => {
      if (updateWarning(field) && !firstEmptyInput) {
        const { input } = field;
        firstEmptyInput = input;
      }
    });

    if (firstEmptyInput) {
      event.preventDefault();
      firstEmptyInput.focus();
      return;
    }

    if (!consent.checked) {
      event.preventDefault();
      consentWarning.hidden = false;
      consent.setAttribute('aria-invalid', 'true');
      consent.focus();
      return;
    }

    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }

    const submitButton = form.querySelector('.form-submit');
    const status = form.querySelector('.form-status');
    const data = {
      name: form.querySelector('#contact-name').value.trim(),
      phone: form.querySelector('#contact-phone').value.trim(),
      email: form.querySelector('#contact-email').value.trim(),
      message: form.querySelector('#contact-message').value.trim(),
      consent: consent.checked
    };

    event.preventDefault();
    submitButton.disabled = true;
    status.dataset.state = '';
    status.textContent = 'Se trimite mesajul...';

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Mesajul nu a putut fi trimis. Încearcă din nou.');
        }

        status.dataset.state = 'success';
        status.textContent = 'Mesajul a fost trimis. Îți mulțumesc!';
        form.reset();
        requiredFields.forEach(({ warning }) => {
          warning.hidden = true;
        });
        consentWarning.hidden = true;
        hasAttemptedSubmit = false;
      })
      .catch((error) => {
        status.dataset.state = 'error';
        status.textContent = error instanceof TypeError
          ? 'Nu s-a putut contacta serviciul de trimitere. Încearcă din nou mai târziu.'
          : error.message;
      })
      .finally(() => {
        submitButton.disabled = false;
      });
  });
});

document.querySelectorAll('[data-year]').forEach((year) => {
  year.textContent = new Date().getFullYear();
});