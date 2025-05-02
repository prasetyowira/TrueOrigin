import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModalProps {
  trigger: React.ReactNode; // Element that opens the modal
  title: string;
  description?: string; // Optional description
  children: React.ReactNode; // Modal content
  footerContent?: React.ReactNode; // Optional custom footer content
  open?: boolean; // Controlled open state
  onOpenChange?: (open: boolean) => void; // Handler for open state changes
  size?: "sm" | "md" | "lg" | "xl" | "full"; // Size variants
  className?: string; // Additional classes for DialogContent
}

/**
 * A reusable modal dialog component built on top of shadcn/ui Dialog.
 */
const Modal: React.FC<ModalProps> = ({
  trigger,
  title,
  description,
  children,
  footerContent,
  open,
  onOpenChange,
  size = "md",
  className,
}) => {
  // Define size classes based on the size prop
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[90vw] max-h-[90vh]",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          sizeClasses[size],
          size === "full" && "overflow-auto",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footerContent && <DialogFooter>{footerContent}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};

export default Modal; 