import * as React from "react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/Modal";

interface ConfirmationModalProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A specialized modal for confirmation actions like deletion or approval.
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  trigger,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  open,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  // Use either controlled or uncontrolled state
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const handleCancel = () => {
    setIsOpen(false);
    if (onCancel) onCancel();
  };

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  return (
    <Modal
      trigger={trigger}
      title={title}
      description={description}
      open={isOpen}
      onOpenChange={setIsOpen}
      size="sm"
      footerContent={
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            {cancelText}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="py-2">
        {/* The description is already in the header, but we need to pass children */}
      </div>
    </Modal>
  );
};

export default ConfirmationModal; 