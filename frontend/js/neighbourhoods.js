/*
 * Shared neighbourhood (Espoo district) filter for The Pulse, Idea Incubator
 * and Community pages.
 *
 *   window.currentHood()            -> "" (all) or a canonical district name
 *   window.setHood(name)            -> persist + fire "hood:changed"
 *   window.hoodLabel(name)          -> localized label ("" -> "All neighbourhoods")
 *   window.nearestDistrict(lat,lon) -> classify a lat/lon into a district
 *   window.mountHoodFilter(host)    -> render a <select> into host, returns it
 *   window.ideaHood(idea)           -> district for a seed idea, or null (show anywhere)
 *
 * Only `reports` and `topics` carry real coordinates. Ideas, exchange posts
 * and community groups have no location field, so the seed items get a
 * demo neighbourhood here; anything the map doesn't know (a real resident
 * submission) is treated as belonging to every neighbourhood.
 *
 * Load order: after js/i18n.js, before the page script.
 */
(function () {
  "use strict";

  // Canonical (Finnish) names + rough centres, mirrored from
  // backend/espoo_districts.py. The filter value is always the canonical
  // name; only the visible label is localized.
  const DISTRICTS = {
    "Leppävaara": [60.219, 24.813],
    "Tapiola": [60.175, 24.805],
    "Matinkylä": [60.16, 24.738],
    "Espoon keskus": [60.203, 24.655],
    "Espoonlahti": [60.147, 24.653],
    "Kauklahti": [60.18, 24.573],
  };
  const NAMES = Object.keys(DISTRICTS);
  const SLUG = {
    "Leppävaara": "leppavaara",
    "Tapiola": "tapiola",
    "Matinkylä": "matinkyla",
    "Espoon keskus": "espoon_keskus",
    "Espoonlahti": "espoonlahti",
    "Kauklahti": "kauklahti",
  };
  const STORAGE_KEY = "lp_hood";

  // Demo neighbourhood for each seeded idea (backend/seed_ideas.py). Real
  // pitches submitted through the form aren't in here and match every filter.
  const IDEA_NEIGHBOURHOODS = {
    "Solar Powered Street Lights on Elm Path": "Leppävaara",
    "Weekend Pop-up Art Market": "Tapiola",
    "Community Garden on 4th Street": "Espoon keskus",
    "Neighborhood Tool Library": "Matinkylä",
    "Free Little Library Boxes": "Espoonlahti",
  };

  // Demo neighbourhood for each seeded Community Exchange post
  // (backend/seed_exchange.py). Posts created through the dialog aren't here
  // and match every filter.
  const EXCHANGE_NEIGHBOURHOODS = {
    "Free tomato & basil seedlings": "Leppävaara",
    "Looking for compost bin advice": "Tapiola",
    "Offering: beginner guitar lessons": "Matinkylä",
    "Need help setting up a website for my hobby project": "Espoonlahti",
    "Pressure washer available to borrow": "Leppävaara",
    "Does anyone have a ladder I could borrow?": "Kauklahti",
    "Can help with grocery runs on Tuesdays": "Espoon keskus",
    "Looking for someone to walk my dog next week": "Tapiola",
  };

  let current = "";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && NAMES.includes(saved)) current = saved;
  } catch (e) {
    /* localStorage unavailable - default to all */
  }

  function currentHood() {
    return current;
  }

  function hoodLabel(name) {
    const T = typeof window.t === "function" ? window.t : (k) => k;
    if (!name) {
      const all = T("hood.all");
      return all === "hood.all" ? "All neighbourhoods" : all;
    }
    const key = "hood.name." + (SLUG[name] || name);
    const label = T(key);
    return label === key ? name : label;
  }

  function setHood(name) {
    const next = NAMES.includes(name) ? name : "";
    if (next === current) return;
    current = next;
    try {
      localStorage.setItem(STORAGE_KEY, current);
    } catch (e) {
      /* ignore - selection just won't persist */
    }
    document.querySelectorAll("select.hood-select").forEach((s) => {
      s.value = current;
    });
    window.dispatchEvent(new CustomEvent("hood:changed", { detail: { hood: current } }));
  }

  function nearestDistrict(lat, lon) {
    if (lat == null || lon == null) return null;
    let best = null;
    let bestDist = Infinity;
    for (const name of NAMES) {
      const [dlat, dlon] = DISTRICTS[name];
      const d = Math.hypot(lat - dlat, lon - dlon);
      if (d < bestDist) {
        bestDist = d;
        best = name;
      }
    }
    return best;
  }

  function ideaHood(idea) {
    return (idea && IDEA_NEIGHBOURHOODS[idea.title]) || null;
  }

  function exchangeHood(post) {
    return (post && EXCHANGE_NEIGHBOURHOODS[post.title]) || null;
  }

  // Does an item belong to the active neighbourhood filter? `hoodOf` returns
  // the item's district or null; null (unknown / real submission) matches all.
  function matchesHood(hoodOf, item) {
    const sel = current;
    if (!sel) return true;
    const h = hoodOf(item);
    return h === null || h === sel;
  }

  function relabelSelects() {
    document.querySelectorAll("select.hood-select").forEach((select) => {
      Array.from(select.options).forEach((opt) => {
        opt.textContent = hoodLabel(opt.value);
      });
      select.value = current;
    });
    document.querySelectorAll("[data-i18n='hood.label']").forEach((el) => {
      const v = typeof window.t === "function" ? window.t("hood.label") : "Neighbourhood";
      el.textContent = v === "hood.label" ? "Neighbourhood" : v;
    });
  }

  function mountHoodFilter(host) {
    const el = typeof host === "string" ? document.querySelector(host) : host;
    if (!el) return null;

    const wrap = document.createElement("label");
    wrap.className = "hood-filter";

    const span = document.createElement("span");
    span.className = "hood-filter-label";
    span.setAttribute("data-i18n", "hood.label");
    span.textContent = "Neighbourhood";

    const select = document.createElement("select");
    select.className = "hood-select";
    ["", ...NAMES].forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = hoodLabel(name);
      select.appendChild(opt);
    });
    select.value = current;
    select.addEventListener("change", (e) => setHood(e.target.value));

    wrap.appendChild(span);
    wrap.appendChild(select);
    el.appendChild(wrap);
    return select;
  }

  window.addEventListener("i18n:changed", relabelSelects);

  window.currentHood = currentHood;
  window.setHood = setHood;
  window.hoodLabel = hoodLabel;
  window.nearestDistrict = nearestDistrict;
  window.ideaHood = ideaHood;
  window.exchangeHood = exchangeHood;
  window.matchesHood = matchesHood;
  window.mountHoodFilter = mountHoodFilter;
  window.NEIGHBOURHOODS = NAMES.slice();
})();
