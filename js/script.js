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
  let hasAttemptedSubmit = false;
  const requiredFields = Array.from(form.querySelectorAll('.form-error')).map((warning) => ({
    input: warning.previousElementSibling,
    warning
  }));

  const updateWarning = ({ input, warning }) => {
    const isEmpty = !input.value.trim();
    const isInvalidName = input.name === 'Nume' && !isEmpty && input.value.trim().split(/\s+/).length < 2;
    const normalizedPhone = input.value.replace(/[\s().-]/g, '');
    const isInvalidPhone = input.name === 'Telefon' && !isEmpty
      && !/^0[237]\d{8}$/.test(normalizedPhone);
    const isInvalidEmail = input.type === 'email' && !isEmpty && input.validity.typeMismatch;
    warning.textContent = isInvalidEmail
      ? 'Introdu o adresă de e-mail validă.'
      : isInvalidName
        ? 'Introdu numele și prenumele.'
        : isInvalidPhone
          ? 'Introdu un număr de telefon valid.'
        : `Adaugă ${input.name === 'Nume' ? 'numele' : input.name === 'Telefon' ? 'numărul de telefon' : 'adresa de e-mail'}.`;
    warning.hidden = !isEmpty && !isInvalidName && !isInvalidPhone && !isInvalidEmail;
    return isEmpty || isInvalidName || isInvalidPhone || isInvalidEmail;
  };

  requiredFields.forEach(({ input, warning }) => {
    input.addEventListener('input', () => {
      if (hasAttemptedSubmit) {
        updateWarning({ input, warning });
      }
    });
  });

  form.addEventListener('submit', (event) => {
    hasAttemptedSubmit = true;
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

    if (!form.reportValidity()) {
      event.preventDefault();
      return;
    }

    const submitButton = form.querySelector('.form-submit');
    const status = form.querySelector('.form-status');
    submitButton.disabled = true;
    status.dataset.state = '';
    status.textContent = 'Se trimite mesajul...';
  });
});

document.querySelectorAll('[data-year]').forEach((year) => {
  year.textContent = new Date().getFullYear();
});