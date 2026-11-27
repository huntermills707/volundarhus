// Category chips + text filter for the /posts/ list (layouts/posts/list.html).
// State lives in the query string (?category=ttrpg&q=dice) so views are linkable.
(function () {
  const root = document.querySelector("[data-post-filter]");
  if (!root) return;

  const chips = Array.from(root.querySelectorAll(".chip"));
  const searchBox = root.querySelector(".post-filter-search");
  const input = root.querySelector("#post-filter-q");
  const status = root.querySelector(".post-filter-status");
  const years = Array.from(document.querySelectorAll(".post-year"));
  const items = Array.from(document.querySelectorAll(".post-year li"));
  const empty = document.querySelector(".post-filter-empty");
  const total = items.length;

  searchBox.hidden = false;
  status.hidden = false;

  const params = new URLSearchParams(location.search);
  let category = params.get("category") || "";
  if (!chips.some((c) => c.dataset.category === category)) category = "";
  input.value = params.get("q") || "";

  function apply() {
    const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;

    for (const li of items) {
      const inCategory = !category || li.dataset.categories.split(" ").includes(category);
      const matches = terms.every((t) => li.dataset.search.includes(t));
      li.hidden = !(inCategory && matches);
      if (!li.hidden) shown++;
    }
    for (const year of years) {
      year.hidden = !year.querySelector("li:not([hidden])");
    }
    for (const chip of chips) {
      if (chip.dataset.category === category) chip.setAttribute("aria-current", "true");
      else chip.removeAttribute("aria-current");
    }

    empty.hidden = shown > 0;
    status.textContent = shown === total ? `${total} posts` : `Showing ${shown} of ${total} posts`;

    const next = new URLSearchParams();
    if (category) next.set("category", category);
    if (input.value.trim()) next.set("q", input.value.trim());
    const qs = next.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }

  for (const chip of chips) {
    chip.addEventListener("click", (e) => {
      e.preventDefault();
      category = chip.dataset.category;
      apply();
    });
  }
  input.addEventListener("input", apply);
  document.querySelector("[data-filter-reset]").addEventListener("click", (e) => {
    e.preventDefault();
    category = "";
    input.value = "";
    apply();
    input.focus();
  });

  apply();
  // Enable chip transitions only after the initial state is drawn, so a
  // linked ?category= view doesn't fade in from "All".
  requestAnimationFrame(() => root.classList.add("is-ready"));
})();
