const panels = [...document.querySelectorAll('.panel')];
const knownPanels = new Set(panels.map((panel) => panel.id));

function sortCreationCards(gallery) {
  const cards = [...gallery.querySelectorAll('.creation-card')];
  cards.sort((a, b) => {
    const statusDifference = (a.dataset.status === 'sold') - (b.dataset.status === 'sold');
    if (statusDifference) return statusDifference;
    const priceDifference = Number(a.dataset.price) - Number(b.dataset.price);
    if (priceDifference) return priceDifference;
    return a.dataset.name.localeCompare(b.dataset.name);
  });
  const firstSold = cards.findIndex((card) => card.dataset.status === 'sold');
  cards.forEach((card, index) => {
    if (index === firstSold) {
      const heading = document.createElement('p');
      heading.className = 'sold-divider';
      heading.setAttribute('role', 'heading');
      heading.setAttribute('aria-level', '3');
      heading.textContent = 'sold pieces';
      gallery.append(heading);
    }
    gallery.append(card);
  });
}

function showPanel() {
  const requested = window.location.hash.slice(1);
  const activeId = knownPanels.has(requested) ? requested : 'home';
  panels.forEach((panel) => {
    const isActive = panel.id === activeId;
    panel.classList.toggle('active', isActive);
    panel.setAttribute('aria-hidden', String(!isActive));
  });
  const heading = document.querySelector(`#${activeId} h1, #${activeId} h2`);
  if (requested && heading) heading.focus({ preventScroll: true });
}

window.addEventListener('hashchange', showPanel);
document.querySelectorAll('.blanket-gallery').forEach(sortCreationCards);
showPanel();

const customOrderForm = document.querySelector('.custom-order-form');

if (customOrderForm) {
  const typeSelect = document.querySelector('#order-type');
  const patternField = document.querySelector('#pattern-select-field');
  const patternSelect = document.querySelector('#order-pattern');
  const otherField = document.querySelector('#pattern-other-field');
  const otherInput = document.querySelector('#order-pattern-other');
  const dueDate = document.querySelector('#order-due-date');
  const comments = document.querySelector('#order-comments');
  const commentsCount = document.querySelector('#comments-count');
  let requestedPattern = null;

  const listingGroups = {
    Blanket: [...document.querySelectorAll('#blankets .creation-card')],
    Amigurumi: [...document.querySelectorAll('#amigurumi .creation-card')],
    Other: [...document.querySelectorAll('#other .creation-card')]
  };

  function appendPatternGroup(label, cards) {
    if (!cards.length) return;
    const group = document.createElement('optgroup');
    group.label = label;
    cards
      .sort((a, b) => a.dataset.name.localeCompare(b.dataset.name))
      .forEach((card) => {
        const option = document.createElement('option');
        option.value = card.dataset.name;
        option.textContent = card.dataset.name;
        group.append(option);
      });
    patternSelect.append(group);
  }

  function showOtherField(show, labelText = 'Tell me what you have in mind') {
    otherField.hidden = !show;
    otherInput.disabled = !show;
    otherInput.required = show;
    otherField.querySelector('label').childNodes[0].textContent = `${labelText} `;
    if (!show) otherInput.value = '';
  }

  function updatePatternChoices() {
    const type = typeSelect.value;
    const cards = listingGroups[type] || [];
    patternSelect.replaceChildren(new Option('Choose a pattern', ''));

    if (type === 'Other' && !cards.length) {
      patternField.hidden = true;
      patternSelect.disabled = true;
      patternSelect.required = false;
      showOtherField(true, 'What would you like made?');
      return;
    }

    showOtherField(false);
    patternField.hidden = !cards.length;
    patternSelect.disabled = !cards.length;
    patternSelect.required = Boolean(cards.length);
    if (!cards.length) return;

    appendPatternGroup('Available listings', cards.filter((card) => card.dataset.status === 'available'));
    appendPatternGroup('Sold examples you can request', cards.filter((card) => card.dataset.status === 'sold'));
    const otherOption = new Option('Other / something different', 'Other / something different');
    patternSelect.append(otherOption);

    if (requestedPattern && cards.some((card) => card.dataset.name === requestedPattern)) {
      patternSelect.value = requestedPattern;
      requestedPattern = null;
    }
  }

  typeSelect.addEventListener('change', updatePatternChoices);
  patternSelect.addEventListener('change', () => {
    showOtherField(patternSelect.value === 'Other / something different');
  });

  document.querySelectorAll('.creation-detail-panel').forEach((panel) => {
    const listingCard = document.querySelector(`.creation-card[href="#${panel.id}"]`);
    const interestLink = panel.querySelector('.interest-link');
    if (!listingCard || !interestLink) return;
    interestLink.href = '#custom';
    interestLink.dataset.requestType = listingCard.closest('#blankets') ? 'blanket' : listingCard.closest('#amigurumi') ? 'amigurumi' : 'other';
    interestLink.dataset.requestPattern = listingCard.dataset.name;
  });

  document.querySelectorAll('[data-request-pattern]').forEach((link) => {
    link.addEventListener('click', () => {
      requestedPattern = link.dataset.requestPattern;
      typeSelect.value = { blanket: 'Blanket', amigurumi: 'Amigurumi', other: 'Other' }[link.dataset.requestType];
      updatePatternChoices();
    });
  });

  const localToday = new Date();
  localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset());
  dueDate.min = localToday.toISOString().slice(0, 10);

  comments.addEventListener('input', () => {
    commentsCount.textContent = `${comments.value.length} / 1000`;
  });

  customOrderForm.addEventListener('submit', () => {
    const submitButton = customOrderForm.querySelector('.order-submit');
    submitButton.disabled = true;
    submitButton.textContent = 'sending request…';
  });

  window.addEventListener('pageshow', () => {
    const submitButton = customOrderForm.querySelector('.order-submit');
    submitButton.disabled = false;
    submitButton.textContent = 'send custom order request →';
  });
}

const detailGalleries = [...document.querySelectorAll('.creation-detail-panel .creation-photos')];

if (detailGalleries.length) {
  const lightbox = document.createElement('div');
  lightbox.className = 'photo-lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Full-size creation photos');
  lightbox.innerHTML = `
    <button class="photo-lightbox-close" type="button" aria-label="Close full-size photos">×</button>
    <button class="photo-lightbox-prev" type="button" aria-label="Previous photo">‹</button>
    <figure class="photo-lightbox-figure">
      <img class="photo-lightbox-image" alt="">
      <figcaption class="photo-lightbox-caption"></figcaption>
    </figure>
    <button class="photo-lightbox-next" type="button" aria-label="Next photo">›</button>
    <p class="photo-lightbox-counter" aria-live="polite"></p>`;
  document.body.append(lightbox);

  const fullImage = lightbox.querySelector('.photo-lightbox-image');
  const caption = lightbox.querySelector('.photo-lightbox-caption');
  const counter = lightbox.querySelector('.photo-lightbox-counter');
  const previousButton = lightbox.querySelector('.photo-lightbox-prev');
  const nextButton = lightbox.querySelector('.photo-lightbox-next');
  const closeButton = lightbox.querySelector('.photo-lightbox-close');
  let activeImages = [];
  let activeIndex = 0;
  let opener = null;

  function showFullImage(index) {
    activeIndex = (index + activeImages.length) % activeImages.length;
    const selected = activeImages[activeIndex];
    fullImage.src = selected.currentSrc || selected.src;
    fullImage.alt = selected.alt;
    caption.textContent = selected.alt;
    counter.textContent = `${activeIndex + 1} of ${activeImages.length}`;
    previousButton.hidden = activeImages.length < 2;
    nextButton.hidden = activeImages.length < 2;
  }

  function openLightbox(image) {
    activeImages = [...image.closest('.creation-photos').querySelectorAll('img')];
    opener = image;
    showFullImage(activeImages.indexOf(image));
    lightbox.classList.add('is-open');
    document.body.classList.add('lightbox-open');
    closeButton.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('lightbox-open');
    fullImage.removeAttribute('src');
    if (opener) opener.focus();
  }

  detailGalleries.forEach((gallery) => {
    gallery.querySelectorAll('img').forEach((image) => {
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', `Open full-size photo: ${image.alt}`);
      image.addEventListener('click', () => openLightbox(image));
      image.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(image);
        }
      });
    });
  });

  previousButton.addEventListener('click', () => showFullImage(activeIndex - 1));
  nextButton.addEventListener('click', () => showFullImage(activeIndex + 1));
  closeButton.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft' && activeImages.length > 1) showFullImage(activeIndex - 1);
    if (event.key === 'ArrowRight' && activeImages.length > 1) showFullImage(activeIndex + 1);
  });
}
