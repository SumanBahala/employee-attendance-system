import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type = "info", message, title = "") => {
    const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const newToast = {
      id,
      type, // 'success' | 'error' | 'warning' | 'info'
      message,
      title: title || (type === "success" ? "Success" : type === "error" ? "Error" : type === "warning" ? "Notice" : "Information"),
      createdAt: Date.now(),
    };

    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 active

    setTimeout(() => {
      removeToast(id);
    }, 4000);

    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="eas-toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`eas-toast-card ${toast.type}`}>
            <div className="eas-toast-icon">
              {toast.type === "success" && "✓"}
              {toast.type === "error" && "✕"}
              {toast.type === "warning" && "⚠"}
              {toast.type === "info" && "ℹ"}
            </div>
            <div className="eas-toast-body">
              <div className="eas-toast-title">{toast.title}</div>
              <div className="eas-toast-message">{toast.message}</div>
            </div>
            <button
              type="button"
              className="eas-toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              ×
            </button>
            <div className="eas-toast-progress"></div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: (type, msg) => console.log(`[Toast ${type}]: ${msg}`),
      removeToast: () => {},
    };
  }
  return ctx;
}
