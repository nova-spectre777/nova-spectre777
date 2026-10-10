const navLinks = [...document.querySelectorAll('nav a[href^="#"]')];
const sections = [...document.querySelectorAll('main section[id]')];
const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('visible');
    const section = entry.target.closest('section');
    if (!section) continue;
    navLinks.forEach(link => {
      if (link.getAttribute('href') === '#' + section.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
}, { threshold: .14 });
document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
