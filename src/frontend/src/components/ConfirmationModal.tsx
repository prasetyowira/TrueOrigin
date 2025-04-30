import * as React from "react";
import Modal from "./Modal"; // Import the base Modal
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";

interface ConfirmationModalProps {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode; // Content explaining the action
  confirmText?: string; // Default: "Confirm"
  cancelText?: string; // Default: "Cancel"
  onConfirm: () => void; // Action to perform on confirm
  onCancel?: () => void; // Optional action on cancel
  confirmVariant?: React.ComponentProps<typeof Button>['variant']; // Default: "destructive" or "primary" based on context?
  cancelVariant?: React.ComponentProps<typeof Button>['variant']; // Default: "secondary"
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: React.ComponentProps<typeof Modal>['size'];
  className?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  trigger,
  title,
  description,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmVariant = "destructive", // Often destructive, but could be primary
  cancelVariant = "secondary",
  open,
  onOpenChange,
  size,
  className,
}) => {
  const handleConfirm = () => {
    onConfirm();
    // Optionally close the modal after confirm, handled by DialogClose or onOpenChange if needed
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    // Modal closes automatically due to DialogClose
  };

  const footer = (
    <>
      <DialogClose asChild>
        <Button type="button" variant={cancelVariant} onClick={handleCancel}>
          {cancelText}
        </Button>
      </DialogClose>
      {/* We might need DialogClose here too if onConfirm doesn't manage state */}
      <DialogClose asChild>
        <Button type="button" variant={confirmVariant} onClick={handleConfirm}>
          {confirmText}
        </Button>
      </DialogClose>
    </>
  );

  return (
    <Modal
      trigger={trigger}
      title={title}
      description={description}
      footerContent={footer}
      open={open}
      onOpenChange={onOpenChange}
      size={size}
      className={className}
    >
      {children}
    </Modal>
  );
};

export default ConfirmationModal; 