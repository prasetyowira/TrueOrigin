import React from 'react';

interface FilterOption {
    label: string;
    value: string;
}

interface Filter {
    label: string;
    options: FilterOption[];
}

interface FiltersProps {
    filters: Filter[];
    onApply: (selectedValues: string[]) => void;
}

const Filters: React.FC<FiltersProps> = ({ filters, onApply }) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(
        filters.map(() => "")
    );

    const handleSelectChange = (index: number, value: string) => {
        const newValues = [...selectedValues];
        newValues[index] = value;
        setSelectedValues(newValues);
    };

    return (
        <div className="flex space-x-4 mb-6">
            <p className="text-xl w-1/6 font-lexend">Filter Transactions</p>
            {filters.map((filter, index) => (
                <select
                    key={index}
                    className="form-select block w-1/6 mt-1 border-gray-300 rounded-md shadow-sm focus:border-purple-500"
                    value={selectedValues[index]}
                    onChange={(e) => handleSelectChange(index, e.target.value)}
                    aria-label={`Filter by ${filter.label}`}
                >
                    <option value="" disabled>
                        {filter.label}
                    </option>
                    {filter.options.map((option, idx) => (
                        <option key={idx} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            ))}
            <button
                onClick={() => onApply(selectedValues)}
                className="bg-[#212EFF] text-white w-1/6 px-4 py-2 rounded-md shadow-sm hover:bg-blue-800"
            >
                Apply
            </button>
        </div>
    );
};

export default Filters;
