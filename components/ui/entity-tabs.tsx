import { cn } from "@/lib/utils";

interface TabItem {
  id: string;
  label: string;
  done?: boolean;
}

interface EntityTabsProps {
  tabs: TabItem[];
  activeId: string;
  onPick: (id: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  onRemove?: (id: string) => void;
}

export function EntityTabs({
  tabs,
  activeId,
  onPick,
  onAdd,
  addLabel = "Add",
  onRemove,
}: EntityTabsProps) {
  const canRemove = tabs.length > 1;

  return (
    <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 pb-px overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            "relative inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-t-md transition-colors whitespace-nowrap",
            "hover:text-slate-900 dark:hover:text-slate-100",
            tab.id === activeId
              ? "text-teal border-b-2 border-teal bg-teal/5"
              : "text-slate-500 dark:text-slate-400",
            tab.done && "text-emerald-700 dark:text-emerald-400"
          )}
          onClick={() => onPick(tab.id)}
        >
          <span>{tab.label}</span>
          {canRemove && onRemove ? (
            <span
              className="ml-0.5 w-4 h-4 inline-flex items-center justify-center rounded-full text-[11px] hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(tab.id);
              }}
              title="Remove"
            >
              ×
            </span>
          ) : (
            <span
              className={cn(
                "ml-0.5 w-4 h-4 inline-flex items-center justify-center rounded-full text-[10px]",
                tab.done
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                  : "text-slate-400"
              )}
            >
              {tab.done ? "✓" : "×"}
            </span>
          )}
        </button>
      ))}
      {onAdd && (
        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-2 text-[13px] font-medium text-teal hover:bg-teal/5 rounded-t-md transition-colors whitespace-nowrap"
          onClick={onAdd}
        >
          + {addLabel}
        </button>
      )}
    </div>
  );
}
