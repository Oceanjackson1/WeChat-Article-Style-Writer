type ProgressBarProps = {
  progress: number; // 0-100
  label?: string;
};

export default function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-xs text-neutral-500 font-medium">{label}</p>
      )}
      <div className="h-0.5 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className="h-full bg-neutral-900 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
