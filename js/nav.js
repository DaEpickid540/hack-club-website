// Shared navbar. Each page includes <nav id="site-nav"></nav> and this script.
const NAV_SECTIONS = [
  {
    label: "Hack Club",
    href: "index.html",
    links: [
      { label: "About", href: "index.html#about" },
      { label: "Meetings", href: "index.html#meetings" },
      { label: "Join", href: "index.html#join" },
    ],
  },
  {
    label: "Members",
    href: "members.html",
    links: [
      { label: "Roster", href: "members.html#roster" },
      { label: "Projects", href: "members.html#projects" },
    ],
  },
  {
    label: "CincyHacks",
    href: "cincyhacks.html",
    links: [
      { label: "About", href: "cincyhacks.html#about" },
      { label: "Schedule", href: "cincyhacks.html#schedule" },
      { label: "FAQ", href: "cincyhacks.html#faq" },
    ],
  },
];

function renderNav() {
  const nav = document.getElementById("site-nav");
  if (!nav) return;

  const currentPage = location.pathname.split("/").pop() || "index.html";

  const sections = NAV_SECTIONS.map((section) => {
    const active = section.href === currentPage ? " active" : "";
    const links = section.links
      .map((link) => `<li><a href="${link.href}">${link.label}</a></li>`)
      .join("");
    return `
      <li class="nav-section${active}">
        <a class="nav-section-title" href="${section.href}">${section.label}</a>
        <ul class="nav-dropdown">${links}</ul>
      </li>`;
  }).join("");

  nav.className = "site-nav";
  nav.innerHTML = `
    <a class="nav-brand" href="index.html">Hack Club</a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="nav-sections" aria-label="Toggle navigation">&#9776;</button>
    <ul class="nav-sections" id="nav-sections">${sections}</ul>`;

  const toggle = nav.querySelector(".nav-toggle");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

renderNav();
