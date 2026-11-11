document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".site-menu");
  toggle.addEventListener("click", function () {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
  const search = document.querySelector("#album-search");
  if (search)
    search.addEventListener("input", function () {
      const query = search.value.trim().toLocaleLowerCase();
      let count = 0;
      document.querySelectorAll("[data-album-title]").forEach(function (card) {
        card.hidden = !card.dataset.albumTitle.includes(query);
        if (!card.hidden) count++;
      });
      document.querySelector("#album-count").textContent = count;
      document.querySelector("#search-empty").hidden = count > 0;
      document.querySelector("#search-status").textContent =
        count + " albums found";
    });
  document.querySelectorAll(".jp-play, .jp-pause").forEach(function (control) {
    control.setAttribute(
      "aria-label",
      control.classList.contains("jp-play") ? "Play preview" : "Pause preview"
    );
    control.setAttribute("tabindex", "0");
  });
});
