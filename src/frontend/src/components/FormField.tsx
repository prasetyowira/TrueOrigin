import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string | null | boolean; // Allow boolean for just error state indication
  containerClassName?: string; // Optional class for the wrapping div
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ id, label, error, className, containerClassName, type, ...props }, ref) => {
    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : null;

    return (
      <div className={cn("grid w-full items-center gap-1.5", containerClassName)}>
        <Label htmlFor={id} className={cn(hasError && "text-destructive")}>
          {label}
        </Label>
        <Input
          type={type}
          id={id}
          ref={ref}
          className={cn(hasError && "border-destructive focus-visible:ring-destructive", className)}
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
FormField.displayName = "FormField";

export { FormField }; 