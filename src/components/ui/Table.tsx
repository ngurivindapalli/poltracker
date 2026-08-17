import React from "react";

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export function Table({ headers, children, className = "" }: TableProps) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TableRow({ children, className = "", onClick }: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-muted/50 transition-colors duration-150 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className = "" }: TableCellProps) {
  return (
    <td className={`px-4 py-3 text-sm text-foreground ${className}`}>
      {children}
    </td>
  );
}
