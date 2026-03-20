(function syncLocalRouteLinks() {
  const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const isStaticPreview = isLocalHost && window.location.port !== "3000";

  if (!isStaticPreview) {
    return;
  }

  const nextOrigin = `${window.location.protocol}//${window.location.hostname}:3000`;
  const routeMap = new Map([
    ["/contact", `${nextOrigin}/contact`],
    ["/contact/", `${nextOrigin}/contact`],
    ["/privacy", `${nextOrigin}/privacy`],
    ["/privacy/", `${nextOrigin}/privacy`],
    ["/terms", `${nextOrigin}/terms`],
    ["/terms/", `${nextOrigin}/terms`],
  ]);

  document.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href")?.trim();
    if (!href) {
      return;
    }

    const nextHref = routeMap.get(href);
    if (!nextHref) {
      return;
    }

    anchor.href = nextHref;
  });
})();
