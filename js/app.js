(() => {
  const { types } = window.TAG_DEMO_DATA;

  // ---------- データ（編集可能・このブラウザに保存） ----------
  const STORAGE_KEY = "tagdemo.db.v1";
  const initialDb = () => {
    const assets = window.TAG_DEMO_DATA.assets.map((a) => ({ ...a, tags: [...a.tags] }));
    return { assets, tags: [...new Set(assets.flatMap((a) => a.tags))] };
  };
  const loadDb = () => {
    try {
      const db = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (db && Array.isArray(db.assets) && Array.isArray(db.tags)) {
        db.assets = db.assets.filter((a) => a && typeof a.name === "string" && types[a.type] && Array.isArray(a.tags));
        return db;
      }
    } catch {}
    return null;
  };
  const saveDb = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {}
  };
  let db = loadDb() || initialDb();

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

  // タグは登録簿 (db.tags) で管理するので、アセットが 0 個のタグも存在できる
  const allTags = () => [...db.tags].sort((a, b) => a.localeCompare(b));
  const tagTotal = (t) => db.assets.filter((a) => a.tags.includes(t)).length;

  // ---------- タグ検索ロジック ----------
  // 選択中のタグをすべて含むアセット
  function supersetAssets(selected) {
    return db.assets.filter((a) => selected.every((t) => a.tags.includes(t)));
  }

  function computeView(selected) {
    if (selected.length === 0) {
      return {
        assets: db.assets.filter((a) => a.tags.length === 0),
        tags: allTags().map((t) => ({ name: t, count: tagTotal(t) })),
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
    const known = allTags();
    return [...new Set(list.filter((t) => known.includes(t)))];
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
    // 移動先にないアセットの選択は解除する
    if (!computeView(state.selected).assets.some((a) => a.name === state.activeAsset)) state.activeAsset = null;
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
    for (const t of state.selected) {
      bc.append(
        el("span", { class: "crumb tag", "data-tag": t }, [
          el("span", { class: "crumb-label" }, [el("i", { class: "dot", style: `background:${tagColor(t)}` }), t]),
          el("button", { class: "crumb-x", type: "button", title: `${t} を外す`, "aria-label": `${t} を外す`, onclick: () => removeTag(t) }, "×"),
        ])
      );
    }
    $("btn-back").disabled = history.length <= 1;
  }

  function renderSidebar(view) {
    const list = $("tag-list");
    list.replaceChildren();
    const available = new Map(view.tags.map((t) => [t.name, t.count]));
    const q = state.tagFilter.toLowerCase();
    for (const t of allTags()) {
      if (q && !t.toLowerCase().includes(q)) continue;
      const isSel = state.selected.includes(t);
      const isAvail = available.has(t);
      const li = el("li", {}, [
        el(
          "button",
          {
            type: "button",
            class: "tag-item" + (isSel ? " selected" : "") + (!isSel && !isAvail ? " unavailable" : ""),
            "data-tag": t,
            // disabled にすると右クリックできないので aria-disabled で表す
            "aria-disabled": !isSel && !isAvail ? "true" : false,
            title: isSel ? `${t} を外す` : isAvail ? `${t} を追加` : "現在の選択と組み合わせられるアセットがありません",
            onclick: () => (isSel ? removeTag(t) : isAvail && addTag(t)),
          },
          [
            el("span", { class: "check", html: isSel ? '<svg viewBox="0 0 16 16"><path d="M3 8l3.5 3.5L13 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>' : "" }),
            el("i", { class: "dot", style: `background:${tagColor(t)}` }),
            el("span", { class: "tag-name" }, t),
            el("span", { class: "count" }, String(isSel ? "" : isAvail ? available.get(t) : tagTotal(t))),
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
            "data-tag": t.name,
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
            "data-asset": a.name,
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
    const asset = findAsset(state.activeAsset);

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
          el("p", { html: "フォルダと違い<b>順序は関係ありません</b>。<code>Environment</code> と <code>Rock</code> をどちらから選んでも同じ場所になります。" }),
          el("p", { html: "選択中のタグは上部に並び、<b>×</b> でそのタグだけを外せます。<b>All</b> で全て解除します。" }),
          el("p", { html: "<b>右クリック</b>（タッチ端末では長押し）で、タグやアセットの追加・名前変更・削除ができます。変更はこのブラウザにだけ保存されます。" }),
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

  const findAsset = (name) => db.assets.find((a) => a.name === name);
  const chip = (t) => el("span", { class: "chip" }, [el("i", { class: "dot", style: `background:${tagColor(t)}` }), t]);
  const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));

  // ---------- 編集操作 ----------
  const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();

  function validateTagName(name, except = null) {
    if (!name) return "タグ名を入力してください";
    if (name.includes(",")) return "タグ名にカンマ (,) は使えません";
    if (db.tags.some((t) => t !== except && sameName(t, name))) return `タグ "${name}" は既に存在します`;
    return null;
  }

  function validateAssetName(name, except = null) {
    if (!name) return "アセット名を入力してください";
    if (/\s/.test(name)) return "アセット名に空白は使えません";
    if (db.assets.some((a) => a.name !== except && sameName(a.name, name))) return `アセット "${name}" は既に存在します`;
    return null;
  }

  // 変更を保存して再描画。選択中のタグが変わる場合は URL も更新する
  function commit(selected = state.selected) {
    saveDb();
    if (selected.join(",") !== state.selected.join(",")) navigate(selected);
    else render();
  }

  // 編集したアセットが現在のビューから外れたら知らせる
  function notifyIfHidden(asset) {
    if (!computeView(state.selected).assets.includes(asset)) {
      toast(`${asset.name} は現在のタグの組み合わせと一致しなくなったため、ここには表示されません`);
      if (state.activeAsset === asset.name) state.activeAsset = null;
    }
  }

  function createTag(name) {
    db.tags.push(name);
  }

  function renameTag(from, to) {
    db.tags = db.tags.map((t) => (t === from ? to : t));
    for (const a of db.assets) a.tags = a.tags.map((t) => (t === from ? to : t));
    commit(state.selected.map((t) => (t === from ? to : t)));
    toast(`タグ "${from}" を "${to}" に変更しました`);
  }

  function deleteTag(name) {
    db.tags = db.tags.filter((t) => t !== name);
    for (const a of db.assets) a.tags = a.tags.filter((t) => t !== name);
    commit(state.selected.filter((t) => t !== name));
    toast(`タグ "${name}" を削除しました`);
  }

  function createAsset(name, type, tags) {
    const asset = { name, type, tags: [...tags] };
    db.assets.push(asset);
    state.activeAsset = name;
    commit();
    notifyIfHidden(asset);
    render();
  }

  function setAssetTags(asset, tags) {
    asset.tags = allTags().filter((t) => tags.includes(t));
    commit();
    notifyIfHidden(asset);
    render();
  }

  function renameAsset(asset, to) {
    if (state.activeAsset === asset.name) state.activeAsset = to;
    asset.name = to;
    commit();
  }

  function duplicateAsset(asset) {
    let n = 1;
    let name;
    do name = `${asset.name}_Copy${n > 1 ? n : ""}`, n++;
    while (findAsset(name));
    createAsset(name, asset.type, asset.tags);
  }

  function deleteAsset(asset) {
    db.assets = db.assets.filter((a) => a !== asset);
    if (state.activeAsset === asset.name) state.activeAsset = null;
    commit();
    toast(`${asset.name} を削除しました`);
  }

  function resetDb() {
    db = initialDb();
    state.activeAsset = null;
    commit(state.selected.filter((t) => db.tags.includes(t)));
    toast("初期データに戻しました");
  }

  // ---------- コンテキストメニュー ----------
  const menu = $("ctx-menu");

  function openMenu(x, y, items) {
    menu.replaceChildren(
      ...items.map((it) => {
        if (it === "-") return el("div", { class: "ctx-sep", role: "separator" });
        if (it.header) return el("div", { class: "ctx-header" }, it.header);
        return el(
          "button",
          {
            type: "button",
            class: "ctx-item" + (it.danger ? " danger" : ""),
            role: "menuitem",
            disabled: it.disabled,
            onclick: () => {
              closeMenu();
              it.action();
            },
          },
          [
            el("span", { class: "ctx-icon", html: it.icon || "" }),
            el("span", { class: "ctx-label" }, it.label),
            el("span", { class: "ctx-key" }, it.key || ""),
          ]
        );
      })
    );
    menu.hidden = false;
    menuScrollTop = $("view").scrollTop;
    // 画面外にはみ出さないよう位置を調整
    const r = menu.getBoundingClientRect();
    menu.style.left = Math.max(4, Math.min(x, innerWidth - r.width - 4)) + "px";
    menu.style.top = Math.max(4, Math.min(y, innerHeight - r.height - 4)) + "px";
    menu.querySelector(".ctx-item:not(:disabled)")?.focus({ preventScroll: true });
  }

  let menuScrollTop = 0;
  function closeMenu() {
    menu.hidden = true;
  }

  const MI = {
    add: '<svg viewBox="0 0 16 16"><path d="M7 2h2v5h5v2H9v5H7V9H2V7h5z" fill="currentColor"/></svg>',
    tag: '<svg viewBox="0 0 16 16"><path d="M1.5 2h6l7 7-5.5 5.5-7-7z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="5" cy="5.5" r="1.2" fill="currentColor"/></svg>',
    edit: '<svg viewBox="0 0 16 16"><path d="M2 14l1-4 8-8 3 3-8 8zM10 3l3 3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    copy: '<svg viewBox="0 0 16 16"><path d="M5 5h9v9H5z M2 11V2h9" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    del: '<svg viewBox="0 0 16 16"><path d="M3 4h10M6 4V2h4v2M4.5 4l.8 10h5.4l.8-10" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    open: '<svg viewBox="0 0 16 16"><path d="M1.5 3.5h5l1.5 1.5h6.5v8h-13z" fill="currentColor"/></svg>',
    close: '<svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6"/></svg>',
    reset: '<svg viewBox="0 0 16 16"><path d="M3 8a5 5 0 105-5H5M5 1v4h4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
  };

  function assetMenu(asset) {
    return [
      { header: asset.name },
      { label: "タグを編集...", icon: MI.tag, action: () => openTagEditor(asset) },
      { label: "名前を変更...", icon: MI.edit, key: "F2", action: () => openRenameAsset(asset) },
      { label: "複製", icon: MI.copy, action: () => duplicateAsset(asset) },
      "-",
      { label: "削除", icon: MI.del, key: "Delete", danger: true, action: () => confirmDeleteAsset(asset) },
    ];
  }

  function tagMenu(tag) {
    const isSel = state.selected.includes(tag);
    const reachable = isSel || computeView(state.selected).tags.some((t) => t.name === tag);
    return [
      { header: `タグ: ${tag}` },
      isSel
        ? { label: "選択から外す", icon: MI.close, action: () => removeTag(tag) }
        : { label: "選択に追加", icon: MI.open, disabled: !reachable, action: () => addTag(tag) },
      { label: "名前を変更...", icon: MI.edit, action: () => openRenameTag(tag) },
      "-",
      { label: "タグを削除...", icon: MI.del, danger: true, action: () => confirmDeleteTag(tag) },
    ];
  }

  function backgroundMenu() {
    return [
      { label: "新規アセット...", icon: MI.add, action: openNewAsset },
      { label: "新規タグ...", icon: MI.tag, action: openNewTag },
      "-",
      { label: "初期データに戻す...", icon: MI.reset, danger: true, action: confirmReset },
    ];
  }

  function menuFor(target) {
    const assetEl = target.closest("[data-asset]");
    if (assetEl) {
      const asset = findAsset(assetEl.dataset.asset);
      if (!asset) return null;
      if (state.activeAsset !== asset.name) {
        state.activeAsset = asset.name;
        render();
      }
      return assetMenu(asset);
    }
    const tagEl = target.closest("[data-tag]");
    if (tagEl) return tagMenu(tagEl.dataset.tag);
    if (target.closest(".main, .toolbar")) return backgroundMenu();
    return null;
  }

  document.addEventListener("contextmenu", (e) => {
    // テキスト入力欄ではブラウザ標準のメニューを残す
    if (e.target.closest("input, textarea, dialog")) return;
    const items = menuFor(e.target);
    if (!items) return;
    e.preventDefault();
    openMenu(e.clientX, e.clientY, items);
  });

  // タッチ端末: 長押しでメニューを開く
  let pressTimer = null;
  let pressStart = null;
  let suppressClick = false;
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch" || e.target.closest("input, dialog, #ctx-menu")) return;
    const { clientX: x, clientY: y, target } = e;
    pressStart = { x, y };
    pressTimer = setTimeout(() => {
      const items = menuFor(target);
      if (!items) return;
      suppressClick = true;
      openMenu(x, y, items);
    }, 550);
  });
  for (const type of ["pointerup", "pointercancel", "pointermove"]) {
    document.addEventListener(type, (e) => {
      // 指が少し動いただけなら長押しを続ける
      if (type === "pointermove" && pressStart && Math.hypot(e.clientX - pressStart.x, e.clientY - pressStart.y) < 8) return;
      clearTimeout(pressTimer);
    });
  }
  document.addEventListener(
    "click",
    (e) => {
      if (suppressClick) {
        suppressClick = false;
        if (!e.target.closest("#ctx-menu")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    },
    true
  );

  document.addEventListener("mousedown", (e) => {
    if (!menu.hidden && !e.target.closest("#ctx-menu")) closeMenu();
  });
  window.addEventListener("blur", closeMenu);
  window.addEventListener("resize", closeMenu);
  // 開く前に起きたスクロールのイベントが遅れて届いても閉じないよう、位置が変わったときだけ閉じる
  $("view").addEventListener("scroll", (e) => e.target.scrollTop !== menuScrollTop && closeMenu());

  document.addEventListener("keydown", (e) => {
    if (!menu.hidden) {
      if (e.key === "Escape") closeMenu();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = [...menu.querySelectorAll(".ctx-item:not(:disabled)")];
        const i = items.indexOf(document.activeElement);
        items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
      }
      return;
    }
    if (dialog.open || e.target.closest("input, textarea")) return;
    const asset = findAsset(state.activeAsset);
    if (!asset) return;
    if (e.key === "F2") {
      e.preventDefault();
      openRenameAsset(asset);
    } else if (e.key === "Delete") {
      e.preventDefault();
      confirmDeleteAsset(asset);
    }
  });

  // ---------- ダイアログ ----------
  const dialog = $("dialog");

  // body: 入力欄などの要素、onSubmit: エラー文字列を返すと閉じずに表示する
  function openDialog({ title, body = [], submitLabel = "OK", danger = false, onSubmit }) {
    const error = el("p", { class: "dlg-error", role: "alert" });
    const form = el("form", { class: "dlg", method: "dialog" }, [
      el("div", { class: "dlg-title" }, title),
      el("div", { class: "dlg-body" }, body),
      error,
      el("div", { class: "dlg-actions" }, [
        el("button", { type: "submit", class: "dlg-btn primary" + (danger ? " danger" : "") }, submitLabel),
        el("button", { type: "button", class: "dlg-btn", onclick: () => dialog.close() }, "キャンセル"),
      ]),
    ]);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = onSubmit(form);
      if (msg) {
        error.textContent = msg;
        return;
      }
      dialog.close();
    });
    dialog.replaceChildren(form);
    dialog.showModal();
    const first = form.querySelector("input[type=text], select");
    if (first) {
      first.focus();
      first.select?.();
    }
  }

  const field = (label, input) => el("label", { class: "dlg-field" }, [el("span", {}, label), input]);
  const textInput = (name, value = "") => el("input", { type: "text", name, value, autocomplete: "off", spellcheck: "false" });

  function openNewTag() {
    openDialog({
      title: "新規タグ",
      body: [
        field("タグ名", textInput("name")),
        el("p", { class: "dlg-note" }, "作成したタグは、アセットに付けるまでは All の画面に 0 assets として表示されます。"),
      ],
      submitLabel: "作成",
      onSubmit: (f) => {
        const name = f.elements.name.value.trim();
        const err = validateTagName(name);
        if (err) return err;
        createTag(name);
        commit();
        toast(`タグ "${name}" を作成しました`);
      },
    });
  }

  function openRenameTag(tag) {
    openDialog({
      title: "タグの名前を変更",
      body: [field("タグ名", textInput("name", tag)), el("p", { class: "dlg-note" }, `${tagTotal(tag)} 個のアセットに反映されます。`)],
      submitLabel: "変更",
      onSubmit: (f) => {
        const name = f.elements.name.value.trim();
        if (name === tag) return;
        const err = validateTagName(name, tag);
        if (err) return err;
        renameTag(tag, name);
      },
    });
  }

  function confirmDeleteTag(tag) {
    const n = tagTotal(tag);
    openDialog({
      title: "タグを削除",
      body: [el("p", {}, `タグ "${tag}" を削除しますか？`), n ? el("p", { class: "dlg-note" }, `${n} 個のアセットからこのタグが外れます。アセット自体は削除されません。`) : null],
      submitLabel: "削除",
      danger: true,
      onSubmit: () => deleteTag(tag),
    });
  }

  function openNewAsset() {
    const typeSelect = el(
      "select",
      { name: "type" },
      Object.entries(types).map(([k, v]) => el("option", { value: k }, v.label))
    );
    openDialog({
      title: "新規アセット",
      body: [
        field("アセット名", textInput("name")),
        field("タイプ", typeSelect),
        el("div", { class: "dlg-field" }, [
          el("span", {}, "タグ"),
          state.selected.length
            ? el("div", { class: "chips" }, state.selected.map((t) => chip(t)))
            : el("span", { class: "dlg-note" }, "なし（タグなしアセットとして作成）"),
        ]),
        el("p", { class: "dlg-note" }, "現在選択中のタグが付いた状態で作成されます。"),
      ],
      submitLabel: "作成",
      onSubmit: (f) => {
        const name = f.elements.name.value.trim();
        const err = validateAssetName(name);
        if (err) return err;
        createAsset(name, f.elements.type.value, state.selected);
        toast(`${name} を作成しました`);
      },
    });
  }

  function openRenameAsset(asset) {
    openDialog({
      title: "アセットの名前を変更",
      body: [field("アセット名", textInput("name", asset.name))],
      submitLabel: "変更",
      onSubmit: (f) => {
        const name = f.elements.name.value.trim();
        if (name === asset.name) return;
        const err = validateAssetName(name, asset.name);
        if (err) return err;
        renameAsset(asset, name);
      },
    });
  }

  function confirmDeleteAsset(asset) {
    openDialog({
      title: "アセットを削除",
      body: [el("p", {}, `${asset.name} を削除しますか？`)],
      submitLabel: "削除",
      danger: true,
      onSubmit: () => deleteAsset(asset),
    });
  }

  function confirmReset() {
    openDialog({
      title: "初期データに戻す",
      body: [el("p", {}, "追加・変更・削除したタグとアセットをすべて破棄して、最初の状態に戻しますか？")],
      submitLabel: "初期データに戻す",
      danger: true,
      onSubmit: resetDb,
    });
  }

  // アセットのタグをチェックボックスで編集する
  function openTagEditor(asset) {
    const checked = new Set(asset.tags);
    const list = el("div", { class: "tag-checklist" });
    const filter = el("input", { type: "search", placeholder: "タグを検索", autocomplete: "off" });
    const newTag = textInput("newTag");
    const renderList = () => {
      const q = filter.value.trim().toLowerCase();
      list.replaceChildren(
        ...allTags()
          .filter((t) => !q || t.toLowerCase().includes(q) || checked.has(t))
          .map((t) => {
            const cb = el("input", { type: "checkbox", checked: checked.has(t) });
            cb.addEventListener("change", () => (cb.checked ? checked.add(t) : checked.delete(t)));
            return el("label", { class: "tag-check" }, [cb, el("i", { class: "dot", style: `background:${tagColor(t)}` }), t]);
          })
      );
    };
    filter.addEventListener("input", renderList);
    filter.addEventListener("keydown", (e) => e.key === "Enter" && e.preventDefault());
    // 一覧にないタグをその場で作って付ける
    const addNew = () => {
      const name = newTag.value.trim();
      const err = validateTagName(name);
      const errorEl = dialog.querySelector(".dlg-error");
      if (err) {
        errorEl.textContent = err;
        return;
      }
      createTag(name);
      saveDb();
      checked.add(name);
      newTag.value = "";
      errorEl.textContent = "";
      renderList();
    };
    newTag.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addNew();
      }
    });
    renderList();
    openDialog({
      title: `タグを編集: ${asset.name}`,
      body: [
        filter,
        list,
        el("div", { class: "dlg-inline" }, [newTag, el("button", { type: "button", class: "dlg-btn", onclick: addNew }, "新しいタグを追加")]),
      ],
      submitLabel: "適用",
      onSubmit: () => {
        setAssetTags(asset, [...checked]);
        render();
      },
    });
    newTag.placeholder = "新しいタグ名";
    filter.focus();
  }

  // ---------- トースト ----------
  let toastTimer = null;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 3200);
  }

  // ---------- イベント ----------
  $("btn-add").addEventListener("click", (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    openMenu(r.left, r.bottom + 2, backgroundMenu().slice(0, 2));
  });
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
