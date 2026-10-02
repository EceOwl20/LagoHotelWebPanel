export const PANEL_LEAVE_EVENT = "panel:request-leave";
const MESSAGE = "Kaydedilmemiş değişiklikleriniz var. Kaydetmeden ayrılmak istiyor musunuz?";

// Only the current tab's SPA navigation needs a custom prompt. A new tab does
// not discard the editor; full document navigation uses beforeunload instead.
export function leavesCurrentPanel(event, location) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const anchor = event.target?.closest?.("a[href]");
  if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return false;
  const destination = new URL(anchor.href, location.href);
  const current = new URL(location.href);
  return destination.origin === current.origin &&
    (destination.pathname !== current.pathname || destination.search !== current.search);
}

export function installPanelNavigationGuard(win, doc, getState) {
  const approve = () => {
    const { dirty, busy } = getState();
    if (busy) {
      win.alert("Kayıt işlemi devam ediyor. Lütfen işlem tamamlanana kadar bekleyin.");
      return false;
    }
    return !dirty || win.confirm(MESSAGE);
  };
  const click = event => {
    if (!leavesCurrentPanel(event, win.location) || approve()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const leave = event => { if (!approve()) event.preventDefault(); };
  const unload = event => {
    const { dirty, busy } = getState();
    if (!dirty && !busy) return;
    event.preventDefault();
    event.returnValue = "";
  };
  doc.addEventListener("click", click, { capture: true });
  win.addEventListener(PANEL_LEAVE_EVENT, leave);
  win.addEventListener("beforeunload", unload);
  return () => {
    doc.removeEventListener("click", click, { capture: true });
    win.removeEventListener(PANEL_LEAVE_EVENT, leave);
    win.removeEventListener("beforeunload", unload);
  };
}

export function requestPanelLeave() {
  return window.dispatchEvent(new Event(PANEL_LEAVE_EVENT, { cancelable: true }));
}
