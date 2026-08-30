import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface SegmentedSelectorProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T | "";
  onChange: (value: T) => void;
  className?: string;
  columns?: 2 | 3 | 4;
}

export function SegmentedSelector<T extends string>({
  options,
  value,
  onChange,
  className,
  columns = 2,
}: SegmentedSelectorProps<T>) {
  return (
    <div
      className={cn(
        "grid gap-2",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
        className
      )}
      role="radiogroup"
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left transition-all",
              selected
                ? "border-primary bg-primary/10 text-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary/60"
            )}
          >
            <span className="block text-sm font-medium">{option.label}</span>
            {option.description ? (
              <span className="mt-1 block text-xs leading-relaxed opacity-80">{option.description}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
