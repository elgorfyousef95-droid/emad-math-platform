import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const MessageContext = createContext(null);

export function notify({ type = "info", title = "تنبيه", message = "" } = {}) {
  if (typeof window !== "undefined" && message) {
    window.dispatchEvent(new CustomEvent("emad:notify", { detail: { type, title, message } }));
  }
}

export function confirmAction({ title = "تأكيد الإجراء", message = "هل تريد المتابعة؟", confirmText = "تأكيد", cancelText = "إلغاء", danger = false } = {}) {
  return new Promise(resolve => {
    if (typeof window === "undefined") return resolve(false);
    window.dispatchEvent(new CustomEvent("emad:confirm", { detail: { title, message, confirmText, cancelText, danger, resolve } }));
  });
}

export default function MessageProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [dialog, setDialog] = useState(null);
  const closeDialog = useCallback(value => {
    setDialog(current => {
      if (current?.resolve) current.resolve(value);
      return null;
    });
  }, []);

  useEffect(() => {
    const onNotify = event => {
      setToast({ ...event.detail, id: Date.now() + Math.random() });
    };
    const onConfirm = event => setDialog(event.detail);
    window.addEventListener("emad:notify", onNotify);
    window.addEventListener("emad:confirm", onConfirm);
    return () => {
      window.removeEventListener("emad:notify", onNotify);
      window.removeEventListener("emad:confirm", onConfirm);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!dialog) return undefined;
    const onKey = event => {
      if (event.key === "Escape") closeDialog(false);
      if (event.key === "Enter") closeDialog(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, closeDialog]);

  return (
    <MessageContext.Provider value={{ notify, confirmAction }}>
      {children}
      {toast && (
        <div className={`emad-toast emad-toast-${toast.type}`} role="status" aria-live="polite">
          <span className="emad-toast-mark" aria-hidden="true">{toast.type === "success" ? "✓" : toast.type === "error" ? "!" : toast.type === "warning" ? "!" : "i"}</span>
          <div className="emad-toast-copy"><b>{toast.title}</b><p>{toast.message}</p></div>
          <button type="button" aria-label="إغلاق التنبيه" onClick={() => setToast(null)}>×</button>
        </div>
      )}
      {dialog && (
        <div className="emad-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) closeDialog(false); }}>
          <section className="emad-dialog" role="alertdialog" aria-modal="true" aria-labelledby="emad-dialog-title">
            <div className={dialog.danger ? "emad-dialog-symbol danger" : "emad-dialog-symbol"}>{dialog.danger ? "!" : "?"}</div>
            <h2 id="emad-dialog-title">{dialog.title}</h2>
            <p>{dialog.message}</p>
            <div className="emad-dialog-actions">
              <button type="button" className="emad-dialog-cancel" onClick={() => closeDialog(false)}>{dialog.cancelText}</button>
              <button type="button" className={dialog.danger ? "emad-dialog-confirm danger" : "emad-dialog-confirm"} onClick={() => closeDialog(true)}>{dialog.confirmText}</button>
            </div>
          </section>
        </div>
      )}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  return useContext(MessageContext);
}
