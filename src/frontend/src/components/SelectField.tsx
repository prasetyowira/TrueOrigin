import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectGroupOption {
  label: string;
  options: SelectOption[];
}

interface SelectFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  options: SelectOption[] | SelectGroupOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string | null | boolean;
  containerClassName?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * A form select field with label and error handling.
 */
const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  error,
  containerClassName,
  required = false,
  disabled = false,
}) => {
  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : null;
  
  // Check if options are grouped
  const isGrouped = options.length > 0 && "options" in options[0];

  return (
    <div className={cn("grid w-full items-center gap-1.5", containerClassName)}>
      <Label htmlFor={id} className={cn(hasError && "text-destructive")}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger 
          id={id}
          className={cn(
            hasError && "border-destructive focus-visible:ring-destructive"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        
        <SelectContent>
          {isGrouped ? (
            // Render grouped options
            (options as SelectGroupOption[]).map((group, groupIndex) => (
              <SelectGroup key={groupIndex}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((option, optionIndex) => (
                  <SelectItem
                    key={`${groupIndex}-${optionIndex}`}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))
          ) : (
            // Render flat options
            (options as SelectOption[]).map((option, index) => (
              <SelectItem key={index} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      {errorMessage && (
        <p className="text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default SelectField; 