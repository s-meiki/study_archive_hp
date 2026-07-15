export const themeStorageKey = "cawg.ui.theme";

/**
 * FOUC防止用のインラインスクリプト。
 * layout の <head> に dangerouslySetInnerHTML で埋め込む。
 * localStorage に明示選択（light/dark）があれば data-theme を設定し、
 * 無ければ何もしない（OS設定に追従）。
 */
export const themeInitScript = `(function () {
  try {
    var saved = localStorage.getItem("${themeStorageKey}");
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (error) {
    /* localStorage が使えない環境でも描画は継続する */
  }
})();`;
