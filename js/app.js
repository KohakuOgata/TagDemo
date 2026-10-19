(() => {
  const { assets, types } = window.TAG_DEMO_DATA;

  // ---------- 状態 ----------
  const state = {
    selected: [], // 選択中のタグ（選択順）
    activeAsset: null, // 詳細パネルに表示中のアセット名
    tagFilter: "",
    assetFilter: "",
  };

  const $ = (id) => document.getElementById(id);
  const el = (tag, props = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of [].concat(children)) {
      if (c != null) node.append(c);
    }
    return node;
  };

  const allTags = [...new Set(assets.flatMap((a) => a.tags))].sort((a, b) => a.localeCompare(b));
  const tagTotals = Object.fromEntries(allTags.map((t) => [t, assets.filter((a) => a.tags.includes(t)).length]));

  // ---------- タグ検索ロジック ----------
  // 選択中のタグをすべて含むアセット
  function supersetAssets(selected) {
    return assets.filter((a) => selected.every((t) => a.tags.includes(t)));
  }

  function computeView(selected) {
    if (selected.length === 0) {
      return {
        assets: assets.filter((a) => a.tags.length === 0),
        tags: allTags.map((t) => ({ name: t, count: tagTotals[t] })),
      };
    }
    const superset = supersetAssets(selected);
    // 選択中のタグと完全一致するアセット
    const exact = superset.filter((a) => a.tags.length === selected.length);
    // 選択中のタグを含むアセットについているが、まだ選択されていないタグ
    const counts = new Map();
    for (const a of superset) {
      for (const t of a.tags) {
        if (!selected.includes(t)) counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    const tags = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { assets: exact, tags };
  }

  // ---------- URL (hash) と履歴 ----------
  function readHash() {
    const m = location.hash.match(/tags=([^&]*)/);
    const list = m ? decodeURIComponent(m[1]).split(",").filter(Boolean) : [];
    return [...new Set(list.filter((t) => allTags.includes(t)))];
  }

  function navigate(selected) {
    const hash = selected.length ? "#tags=" + encodeURIComponent(selected.join(",")) : "#";
    if (location.hash === hash || (hash === "#" && location.hash === "")) {
      render();
      return;
    }
    location.hash = hash; // hashchange で render される
  }

  const addTag = (t) => !state.selected.includes(t) && navigate([...state.selected, t]);
  const removeTag = (t) => navigate(state.selected.filter((s) => s !== t));

  window.addEventListener("hashchange", () => {
    state.selected = readHash();
    state.activeAsset = null;
    render();
  });

  // ---------- アイコン ----------
  const ICONS = {
    StaticMesh:
      '<path d="M32 10l18 10v22L32 52 14 42V20z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M14 20l18 10 18-10M32 30v22" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>',
    SkeletalMesh:
      '<circle cx="32" cy="14" r="6" fill="currentColor"/><path d="M32 22v16M20 28l12 2 12-2M32 38l-8 16M32 38l8 16" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>',
    Material:
      '<defs><radialGradient id="mg" cx="38%" cy="35%" r="65%"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".35" stop-color="currentColor"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient></defs><circle cx="32" cy="32" r="20" fill="url(#mg)"/>',
    Texture:
      '<rect x="14" y="14" width="36" height="36" fill="none" stroke="currentColor" stroke-width="3"/><path d="M14 14h9v9h-9zM32 14h9v9h-9zM23 23h9v9h-9zM41 23h9v9h-9zM14 32h9v9h-9zM32 32h9v9h-9zM23 41h9v9h-9zM41 41h9v9h-9z" fill="currentColor" opacity=".8"/>',
    Blueprint:
      '<rect x="10" y="16" width="16" height="12" rx="2" fill="currentColor"/><rect x="38" y="12" width="16" height="12" rx="2" fill="currentColor"/><rect x="38" y="38" width="16" height="12" rx="2" fill="currentColor"/><path d="M26 22c8 0 4-4 12-4M26 22c8 0 4 22 12 22" fill="none" stroke="currentColor" stroke-width="2.5"/>',
    AnimBlueprint:
      '<rect x="10" y="16" width="16" height="12" rx="2" fill="currentColor"/><rect x="38" y="26" width="16" height="12" rx="2" fill="currentColor"/><path d="M26 22c8 0 4 10 12 10" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M14 44h36M20 40v8M32 40v8M44 40v8" stroke="currentColor" stroke-width="2.5"/>',
    WidgetBlueprint:
      '<rect x="10" y="14" width="44" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><path d="M10 22h44" stroke="currentColor" stroke-width="3"/><rect x="16" y="28" width="14" height="5" fill="currentColor"/><rect x="16" y="37" width="22" height="5" fill="currentColor" opacity=".6"/>',
    Animation:
      '<circle cx="36" cy="12" r="5" fill="currentColor"/><path d="M34 20l-6 12 8 6-4 14M28 32l-10 2M36 22l10 8M36 38l10 4" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
    Sound:
      '<path d="M12 26h8l12-10v32L20 38h-8z" fill="currentColor"/><path d="M38 24c4 4 4 12 0 16M44 18c8 8 8 20 0 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    Niagara:
      '<path d="M32 8l4 14 14 4-14 4-4 14-4-14-14-4 14-4z" fill="currentColor"/><path d="M48 40l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM16 42l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="currentColor" opacity=".7"/>',
    Level:
      '<path d="M8 48l14-20 10 12 8-8 16 16z" fill="currentColor"/><circle cx="44" cy="18" r="5" fill="currentColor" opacity=".7"/>',
  };

  const thumbSvg = (type) =>
    `<svg viewBox="0 0 64 64" style="color:${types[type].color}">${ICONS[type] || ""}</svg>`;

  const TAG_ICON =
    '<svg viewBox="0 0 64 64" class="tag-svg"><path d="M6 16a4 4 0 014-4h14l5 6h25a4 4 0 014 4v26a4 4 0 01-4 4H10a4 4 0 01-4-4z" fill="currentColor"/><path d="M24 28h12l9 9-8 8-9-9z" fill="none" stroke="#1a1a1a" stroke-width="2.6" stroke-linejoin="round" opacity=".75"/><circle cx="28.5" cy="32" r="1.8" fill="#1a1a1a" opacity=".75"/></svg>';

  // タグ名から安定した色を作る
  const tagHue = (t) => {
    let h = 0;
    for (const c of t) h = (h * 31 + c.charCodeAt(0)) % 360;
    return h;
  };
  const tagColor = (t) => `hsl(${tagHue(t)} 45% 62%)`;

  // ---------- 描画 ----------
  function render() {
    const view = computeView(state.selected);
    renderBreadcrumb();
    renderSidebar(view);
    renderGrid(view);
    renderDetails(view);
  }

  function renderBreadcrumb() {
    const bc = $("breadcrumb");
    bc.replaceChildren();
    bc.append(
      el(
        "button",
        { class: "crumb root" + (state.selected.length ? "" : " current"), type: "button", onclick: () => navigate([]) },
        [el("span", { html: '<svg viewBox="0 0 16 16"><path d="M1.5 3.5h5l1.5 1.5h6.5v8h-13z" fill="currentColor"/></svg>' }), "All"]
      )
    );
    state.selected.forEach((t, i) => {
      bc.append(el("span", { class: "crumb-sep", html: "&rsaquo;" }));
      const chip = el("span", { class: "crumb tag" + (i === state.selected.length - 1 ? " current" : "") }, [
        el("button", {
          class: "crumb-label",
          type: "button",
          title: "ここまでのタグに戻る",
          onclick: () => navigate(state.selected.slice(0, i + 1)),
        }, [el("i", { class: "dot", style: `background:${tagColor(t)}` }), t]),
        el("button", { class: "crumb-x", type: "button", title: `${t} を外す`, "aria-label": `${t} を外す`, onclick: () => removeTag(t) }, "×"),
      ]);
      bc.append(chip);
    });
    $("btn-back").disabled = history.length <= 1;
  }

  function renderSidebar(view) {
    const list = $("tag-list");
    list.replaceChildren();
    const available = new Map(view.tags.map((t) => [t.name, t.count]));
    const q = state.tagFilter.toLowerCase();
    for (const t of allTags) {
      if (q && !t.toLowerCase().includes(q)) continue;
      const isSel = state.selected.includes(t);
      const isAvail = available.has(t);
      const li = el("li", {}, [
        el(
          "button",
          {
            type: "button",
            class: "tag-item" + (isSel ? " selected" : "") + (!isSel && !isAvail ? " unavailable" : ""),
            disabled: !isSel && !isAvail,
            title: isSel ? `${t} を外す` : isAvail ? `${t} を追加` : "現在の選択と組み合わせられるアセットがありません",
            onclick: () => (isSel ? removeTag(t) : addTag(t)),
          },
          [
            el("span", { class: "check", html: isSel ? '<svg viewBox="0 0 16 16"><path d="M3 8l3.5 3.5L13 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>' : "" }),
            el("i", { class: "dot", style: `background:${tagColor(t)}` }),
            el("span", { class: "tag-name" }, t),
            el("span", { class: "count" }, String(isSel ? "" : isAvail ? available.get(t) : tagTotals[t])),
          ]
        ),
      ]);
      list.append(li);
    }
  }

  function renderGrid(view) {
    const q = state.assetFilter.toLowerCase();
    const tags = view.tags.filter((t) => !q || t.name.toLowerCase().includes(q));
    const shown = view.assets.filter((a) => !q || a.name.toLowerCase().includes(q));

    const tagGrid = $("tag-grid");
    tagGrid.replaceChildren(
      ...tags.map((t) =>
        el(
          "button",
          {
            type: "button",
            class: "tile tag-tile",
            title: `${t.name} を選択に追加（${t.count} アセット）`,
            onclick: () => addTag(t.name),
          },
          [
            el("div", { class: "thumb", style: `color:${tagColor(t.name)}`, html: TAG_ICON }),
            el("div", { class: "tile-name" }, t.name),
            el("div", { class: "tile-type" }, `${t.count} asset${t.count === 1 ? "" : "s"}`),
          ]
        )
      )
    );

    const assetGrid = $("asset-grid");
    assetGrid.replaceChildren(
      ...shown.map((a) =>
        el(
          "button",
          {
            type: "button",
            class: "tile asset-tile" + (state.activeAsset === a.name ? " active" : ""),
            style: `--type-color:${types[a.type].color}`,
            title: a.name,
            onclick: () => {
              state.activeAsset = state.activeAsset === a.name ? null : a.name;
              render();
            },
          },
          [
            el("div", { class: "thumb", html: thumbSvg(a.type) }),
            el("div", { class: "type-bar" }),
            el("div", { class: "tile-name" }, a.name),
            el("div", { class: "tile-type" }, types[a.type].label),
          ]
        )
      )
    );

    const noSel = state.selected.length === 0;
    $("tag-section-label").textContent = noSel
      ? `すべてのタグ (${tags.length})`
      : `絞り込み候補のタグ (${tags.length})`;
    $("tag-section-label").hidden = tags.length === 0;
    $("asset-section-label").textContent = noSel
      ? `タグなしのアセット (${shown.length})`
      : `完全一致するアセット (${shown.length})`;
    $("asset-section-label").hidden = shown.length === 0;

    const empty = $("empty");
    empty.hidden = tags.length + shown.length > 0;
    empty.textContent = q ? `"${state.assetFilter}" に一致する項目はありません` : "このフォルダ（タグの組み合わせ）は空です";

    $("statusbar").textContent =
      `${tags.length + shown.length} items` +
      (state.activeAsset ? " (1 selected)" : "") +
      `  —  ${tags.length} tags, ${shown.length} assets`;
  }

  function renderDetails(view) {
    const body = $("details-body");
    body.replaceChildren();
    const asset = assets.find((a) => a.name === state.activeAsset);

    if (!asset) {
      const sel = state.selected;
      body.append(
        el("div", { class: "details-section" }, [
          el("div", { class: "details-title" }, "現在のビュー"),
          el("div", { class: "kv" }, [el("span", {}, "選択中のタグ"), el("span", {}, sel.length ? "" : "なし")]),
          sel.length ? el("div", { class: "chips" }, sel.map((t) => chip(t))) : null,
          el("div", { class: "kv" }, [
            el("span", {}, sel.length ? "完全一致" : "タグなし"),
            el("span", {}, `${view.assets.length} assets`),
          ]),
          sel.length
            ? el("div", { class: "kv" }, [
                el("span", {}, "選択タグをすべて含む"),
                el("span", {}, `${supersetAssets(sel).length} assets`),
              ])
            : null,
          el("div", { class: "kv" }, [el("span", {}, "次に選べるタグ"), el("span", {}, `${view.tags.length} tags`)]),
        ]),
        el("div", { class: "details-section help" }, [
          el("div", { class: "details-title" }, "使い方"),
          el("p", { html: "タグは<b>フォルダ</b>のように振る舞います。タグをクリックすると選択に加わり、そのタグの組み合わせを<b>ちょうど</b>持つアセットが表示されます。" }),
          el("p", { html: "フォルダと違い<b>順序は関係ありません</b>。<code>Environment › Rock</code> と <code>Rock › Environment</code> は同じ場所です。" }),
          el("p", { html: "パンくずのタグをクリックするとそこまで戻り、<b>×</b> でそのタグだけを外せます。" }),
        ])
      );
      return;
    }

    const t = types[asset.type];
    body.append(
      el("div", { class: "details-preview", style: `--type-color:${t.color}`, html: thumbSvg(asset.type) }),
      el("div", { class: "details-section" }, [
        el("div", { class: "details-name" }, asset.name),
        el("div", { class: "kv" }, [el("span", {}, "Type"), el("span", { style: `color:${t.color}` }, t.label)]),
        el("div", { class: "kv" }, [el("span", {}, "Tags"), el("span", {}, asset.tags.length ? `${asset.tags.length}` : "なし")]),
        asset.tags.length ? el("div", { class: "chips" }, asset.tags.map((tg) => chip(tg))) : null,
        asset.tags.length
          ? el("div", { class: "kv" }, [
              el("span", {}, "フォルダ換算"),
              el("code", { class: "path" }, "/" + asset.tags.join("/") + "/"),
            ])
          : null,
        asset.tags.length
          ? el("p", { class: "note" }, `タグは順不同なので、このアセットへは ${factorial(asset.tags.length)} 通りの順番でたどり着けます。`)
          : el("p", { class: "note" }, "タグがまだ付いていないアセットです。最初の画面にだけ表示されます。"),
      ])
    );
  }

  const chip = (t) => el("span", { class: "chip" }, [el("i", { class: "dot", style: `background:${tagColor(t)}` }), t]);
  const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));

  // ---------- イベント ----------
  $("btn-back").addEventListener("click", () => history.back());
  $("btn-forward").addEventListener("click", () => history.forward());
  $("tag-filter").addEventListener("input", (e) => {
    state.tagFilter = e.target.value;
    render();
  });
  $("asset-filter").addEventListener("input", (e) => {
    state.assetFilter = e.target.value;
    render();
  });
  $("thumb-size").addEventListener("input", (e) => {
    document.documentElement.style.setProperty("--tile", e.target.value + "px");
  });
  $("view").addEventListener("click", (e) => {
    if (e.target === e.currentTarget && state.activeAsset) {
      state.activeAsset = null;
      render();
    }
  });

  state.selected = readHash();
  render();
})();
