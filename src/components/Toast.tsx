import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  notify: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  error: "border-red-500/30 bg-red-500/10 text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-300",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 backdrop-blur-sm shadow-lg ${colors[toast.type]} animate-in slide-in-from-bottom-2 duration-200`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm flex-1 leading-relaxed">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
