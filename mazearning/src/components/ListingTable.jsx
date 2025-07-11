// src/components/ListingTable.jsx
import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

export default function ListingTable({
  columns,
  data,
  loading = false,

  // Pagination
  pageCount, // for controlled/server-side
  controlledPageIndex,
  controlledPageSize,
  onPageChange,
  onPageSizeChange,

  // Filtering
  globalFilter,
  onGlobalFilterChange,

  // Sorting
  sorting,
  onSortingChange,

  // Manual/controlled mode flags
  manualPagination = false,
  manualSorting = false,
  manualFiltering = false,
}) {
  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
      pagination: {
        pageIndex: controlledPageIndex ?? 0,
        pageSize: controlledPageSize ?? 10,
      },
    },
    manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
    manualSorting,
    manualFiltering,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange,
    onSortingChange,
    onPaginationChange: updater => {
      if (typeof updater === "function") {
        const { pageIndex, pageSize } = updater({
          pageIndex: controlledPageIndex ?? 0,
          pageSize: controlledPageSize ?? 10,
        });
        onPageChange && onPageChange(pageIndex);
        onPageSizeChange && onPageSizeChange(pageSize);
      } else {
        if (onPageChange && updater.pageIndex !== undefined) onPageChange(updater.pageIndex);
        if (onPageSizeChange && updater.pageSize !== undefined) onPageSizeChange(updater.pageSize);
      }
    },
  });

  return (
    <div>
      {/* Filter Input */}
      {onGlobalFilterChange && (
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Filter items"
            value={globalFilter || ""}
            onChange={e => onGlobalFilterChange(e.target.value)}
            style={{ padding: 8, width: 220 }}
          />
        </div>
      )}

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  style={{
                    cursor: header.column.getCanSort() ? "pointer" : "default",
                    borderBottom: "2px solid #eee",
                    padding: "10px 8px",
                    background: "#f9f9f9"
                  }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{
                    asc: " ▲",
                    desc: " ▼"
                  }[header.column.getIsSorted()] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", padding: 16 }}>
                Loading...
              </td>
            </tr>
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", padding: 16 }}>
                No data found.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} style={{ padding: "8px 6px", borderBottom: "1px solid #eee" }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div style={{ display: "flex", alignItems: "center", marginTop: 16, gap: 16 }}>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage() || loading}
        >
          Prev
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {manualPagination
            ? pageCount
            : table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage() || loading}
        >
          Next
        </button>
        <span style={{ marginLeft: "auto" }}>
          Rows per page:{" "}
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value));
              if (onPageSizeChange) onPageSizeChange(Number(e.target.value));
            }}
          >
            {[5, 10, 25, 50].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </span>
      </div>
    </div>
  );
}
