import type { ReactNode } from "react";

interface Props {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  refetch?: () => void;
  className?: string;
  children: ReactNode;
}

export default function WidgetShell({
  isLoading,
  isError,
  isEmpty,
  refetch,
  className,
  children,
}: Props) {
  if (isLoading) {
    return (
      <div className={className}>
        <div className="skeleton" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={className}>
        <div className="widget-error">
          <p>Failed to load data</p>
          {refetch && <button onClick={refetch}>Retry</button>}
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={className}>
        <div className="widget-error">
          <p>No data for selected period</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
