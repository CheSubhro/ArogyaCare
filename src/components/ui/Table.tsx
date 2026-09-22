import type { ReactNode } from 'react';

interface TableColumn<T> {
    key: keyof T | string;
    header: string;
    render?: (row: T) => ReactNode;
}

interface TableProps<T> {
    columns: TableColumn<T>[];
    data: T[];
    emptyMessage?: string;
}

export default function Table<T extends Record<string, unknown>>({
    columns,
    data,
    emptyMessage = 'No data found.',
}: TableProps<T>) {
    return (
        <div className="w-full overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full min-w-full border-collapse text-left">
                <thead>
                    <tr className="border-b border-[var(--color-border)] bg-slate-50">
                        {columns.map((column) => (
                            <th
                                key={String(column.key)}
                                className="px-4 py-3 text-sm font-semibold text-[var(--color-text)]"
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {data.length > 0 ? (
                        data.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-slate-50"
                            >
                                {columns.map((column) => (
                                    <td
                                        key={String(column.key)}
                                        className="px-4 py-3 text-sm text-[var(--color-text)]"
                                    >
                                        {column.render
                                            ? column.render(row)
                                            : String(row[column.key as keyof T] ?? '-')}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
