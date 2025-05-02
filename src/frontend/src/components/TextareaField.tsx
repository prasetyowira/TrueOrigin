import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  error?: string | null | boolean;
  containerClassName?: string;
  required?: boolean;
}

/**
 * A form textarea field with label and error handling.
 */
const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ id, label, error, className, containerClassName, required = false, ...props }, ref) => {
    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : null;

    return (
      <div className={cn("grid w-full items-center gap-1.5", containerClassName)}>
        <Label htmlFor={id} className={cn(hasError && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Textarea
          id={id}
          ref={ref}
          className={cn(hasError && "border-destructive focus-visible:ring-destructive", className)}
          aria-invalid={hasError}
          {...props}
        />
        {errorMessage && (
          <p className="text-sm font-medium text-destructive">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);
TextareaField.displayName = "TextareaField";

export { TextareaField }; 