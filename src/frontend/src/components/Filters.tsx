import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

/**
 * Represents a single option within a filter dropdown.
 */
interface FilterOption {
    /** The visible text label for the option. */
    label: string;
    /** The value associated with the option. */
    value: string;
}

/**
 * Represents a single filter category with its options.
 */
interface Filter {
    /** The placeholder label displayed on the dropdown. */
    label: string;
    /** An array of FilterOption objects for the dropdown. */
    options: FilterOption[];
}

/**
 * Props for the Filters component.
 */
interface FiltersProps {
    /** An array of Filter objects defining the available filters. */
    filters: Filter[];
    /** Callback function invoked when the 'Apply' button is clicked. Receives an array of selected values. */
    onApply: (selectedValues: string[]) => void;
    /** Optional className for the container div */
    className?: string;
}

/**
 * Renders a row of dropdown filters with an Apply button, using shadcn/ui components.
 *
 * @param filters - The filter definitions.
 * @param onApply - Callback function for applying filters.
 * @param className - Optional additional classes for the container.
 */
const Filters: React.FC<FiltersProps> = ({ filters, onApply, className }) => {
    // Initialize state with empty strings for each filter
    const [selectedValues, setSelectedValues] = React.useState<Record<string, string>>(() =>
        filters.reduce((acc, filter) => {
            acc[filter.label] = "";
            return acc;
        }, {} as Record<string, string>)
    );

    // Handle select change using the filter label as the key
    const handleSelectChange = (filterLabel: string, value: string) => {
        setSelectedValues(prevValues => ({
            ...prevValues,
            [filterLabel]: value,
        }));
    };

    // Prepare values array for onApply callback
    const handleApply = () => {
        // Convert the selectedValues object back to an array in the original filter order
        const orderedValues = filters.map(filter => selectedValues[filter.label] || "");
        onApply(orderedValues);
    };

    return (
        <div className={cn("flex flex-wrap items-center gap-4 mb-6", className)}> {/* Use gap and flex-wrap */}
            <p className="text-lg font-medium">Filter By:</p> {/* Adjusted text style */}
            {filters.map((filter) => (
                <Select
                    key={filter.label}
                    value={selectedValues[filter.label]} // Use filter label as key
                    onValueChange={(value) => handleSelectChange(filter.label, value)}
                >
                    <SelectTrigger className="w-full sm:w-[180px]"> {/* Fixed width for consistency */}
                        <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Optional: Add an 'All' option */}
                        {/* <SelectItem value="all">All {filter.label}</SelectItem> */}
                        {filter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ))}
            <Button onClick={handleApply}> {/* Use shadcn Button, removed hardcoded color */}
                Apply
            </Button>
        </div>
    );
};

export default Filters;
