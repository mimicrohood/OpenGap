const menu = document.querySelector("#mobile-nav");
const openButton = document.querySelector("#menu");
const closeButton = document.querySelector("#menu-close");

openButton.addEventListener("click", () => {
  menu.classList.add("open");
  document.body.style.overflow = "hidden";
});

function closeMenu() {
  menu.classList.remove("open");
  document.body.style.overflow = "";
}

closeButton.addEventListener("click", closeMenu);
menu.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", closeMenu);
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold:0.12 });

document.querySelectorAll(".reveal").forEach(item => observer.observe(item));

document.querySelectorAll("details").forEach(details => {
  details.addEventListener("toggle", () => {
    if (!details.open) return;
    document.querySelectorAll("details").forEach(other => {
      if (other !== details) other.open = false;
    });
  });
});

const header = document.querySelector(".site-header");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
}, { passive:true });
