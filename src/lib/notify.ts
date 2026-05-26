import { toast } from "sonner";

// Silent notifications — sound was removed by user preference.
const DEFAULT_DURATION = 4500;

export function notifySuccess(msg: string, opts?: { description?: string }) {
  toast.success(msg, { description: opts?.description, duration: DEFAULT_DURATION });
}

export function notifyError(msg: string, opts?: { description?: string }) {
  toast.error(msg, { description: opts?.description, duration: DEFAULT_DURATION });
}

export function notifyInfo(msg: string, opts?: { description?: string }) {
  toast(msg, { description: opts?.description, duration: DEFAULT_DURATION });
}
