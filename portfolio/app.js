const themeToggle = document.querySelector('.theme-toggle');
const root = document.documentElement;

themeToggle.addEventListener('click', () => {
  const isLight = root.dataset.theme !== 'light';
  root.dataset.theme = isLight ? 'light' : 'dark';
  themeToggle.setAttribute('aria-pressed', String(isLight));
  themeToggle.setAttribute(
    'aria-label',
    isLight ? 'Switch to dark theme' : 'Switch to light theme'
  );
  themeToggle.querySelector('.theme-label').textContent = isLight ? 'Light' : 'Dark';
});

const profilePhoto = document.querySelector('.profile-photo');
profilePhoto.addEventListener('load', () => {
  profilePhoto.parentElement.classList.add('has-photo');
});
profilePhoto.addEventListener('error', () => {
  profilePhoto.remove();
});
if (profilePhoto.complete && profilePhoto.naturalWidth > 0) {
  profilePhoto.parentElement.classList.add('has-photo');
}

document.querySelectorAll('.experience-mark img').forEach((logo) => {
  logo.addEventListener('error', () => {
    const card = logo.closest('.experience-card');
    const fallback = document.createElement('span');
    fallback.className = 'experience-logo-fallback';
    fallback.textContent = card.querySelector('.experience-company').innerText;
    logo.replaceWith(fallback);
    card.classList.add('logo-fallback');
  });
});
