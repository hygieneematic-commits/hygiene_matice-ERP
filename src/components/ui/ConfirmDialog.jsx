import Modal from "./Modal";
import Button from "./Button";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ open, onClose, onConfirm, title = "Are you sure?", description, confirmLabel = "Delete", danger = true }) {
  return (
    <Modal open={open} onClose={onClose} size="sm" title="" >
      <div className="flex flex-col items-center text-center -mt-2">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${danger ? "bg-danger-50" : "bg-brand-50"}`}>
          <AlertTriangle size={20} className={danger ? "text-danger-500" : "text-brand-600"} />
        </div>
        <h3 className="text-base font-semibold text-ink-900 mb-1.5">{title}</h3>
        {description && <p className="text-sm text-ink-500 mb-6">{description}</p>}
        <div className="flex gap-3 w-full">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            variant={danger ? "danger" : "primary"}
            className="flex-1"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
