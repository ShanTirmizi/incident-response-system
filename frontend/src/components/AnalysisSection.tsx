type ColorVariant = "purple" | "green" | "red" | "amber";

interface AnalysisSectionProps {
  title: string;
  items: string[];
  color: ColorVariant;
}

const glassColors: Record<ColorVariant, string> = {
  purple: "glass-purple",
  green: "glass-green",
  red: "glass-red",
  amber: "glass-amber",
};

const textColors: Record<ColorVariant, string> = {
  purple: "text-purple-800",
  green: "text-green-800",
  red: "text-red-800",
  amber: "text-amber-800",
};

const dotColors: Record<ColorVariant, string> = {
  purple: "bg-purple-500",
  green: "bg-green-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
};

/**
 * Section component for displaying policy analysis results
 */
export function AnalysisSection({ title, items, color }: AnalysisSectionProps) {
  if (items.length === 0) return null;

  const sectionId = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div
      className={`${glassColors[color]} rounded-xl p-5 transition-all duration-200 hover:shadow-md`}
      role="region"
      aria-labelledby={sectionId}
    >
      <h5
        id={sectionId}
        className={`font-semibold ${textColors[color]} mb-3`}
      >
        {title}
      </h5>
      <ul className="space-y-2" role="list">
        {items.map((item, i) => (
          <li key={i} className={`flex items-start gap-3 text-sm ${textColors[color]}`}>
            <span
              className={`w-2 h-2 ${dotColors[color]} rounded-full mt-1.5 flex-shrink-0`}
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
