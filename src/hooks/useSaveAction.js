import { useCallback, useRef, useState } from 'react';
import { useToast } from '../context/ToastContext';

// A synchronous lock protects rapid taps before React disables the button.
export default function useSaveAction(task) {
  const taskRef = useRef(task); taskRef.current = task;
  const locked = useRef(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const run = useCallback(async (...args) => {
    args[0]?.preventDefault?.();
    if (locked.current) return;
    locked.current = true; setSaving(true);
    try { return await taskRef.current(...args); }
    catch (error) { toast.error(error.message || 'The change could not be saved. Please retry.', { title: 'Changes not saved' }); return false; }
    finally { locked.current = false; setSaving(false); }
  }, [toast]);
  return [run, saving];
}
