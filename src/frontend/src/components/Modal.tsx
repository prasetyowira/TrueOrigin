import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Assuming shadcn alias is setup as @
import { cn } from "@/lib/utils"; // For conditional classes

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

const Modal: React.FC<ModalProps> = ({
  trigger,
  title,
  description,
  children,
  footerContent,
  open,
  onOpenChange,
  size = "md", // Default size
  className,
}) => {
  // Map size prop to Tailwind width classes (adjust as needed)
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full h-full", // Example for full screen
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn("sm:max-w-[425px]", sizeClasses[size], className)} // Default + size + custom classes
        // Prevent close on outside click if needed (can be prop later)
        // onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4"> {/* Add some padding for content */}
          {children}
        </div>
        {footerContent && (
          <DialogFooter>
             {/* Example: You might want a default close button if no footer provided */}
            {footerContent}
            {/* <DialogClose asChild>
              <Button type="button" variant="secondary">Close</Button>
            </DialogClose> */}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Modal; 