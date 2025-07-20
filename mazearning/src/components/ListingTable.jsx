// mazearning/src/components/ListingTable.jsx

import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  useTheme,
} from "@mui/material";

import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

export default function ListingTable({
  columns,
  data,
  loading = false,

  // Pagination
  pageCount,
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

  // Flags for manual control
  manualPagination = false,
  manualSorting = false,
  manualFiltering = false,
}) {
  const theme = useTheme();

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
    onSortingChange,
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      const nextState =
        typeof updater === "function"
          ? updater({
              pageIndex: controlledPageIndex ?? 0,
              pageSize: controlledPageSize ?? 10,
            })
          : updater;
      if (onPageChange && nextState.pageIndex !== undefined)
        onPageChange(nextState.pageIndex);
      if (onPageSizeChange && nextState.pageSize !== undefined)
        onPageSizeChange(nextState.pageSize);
    },
  });

  const pageSizeOptions = [5, 10, 25, 50];

  return (
    <Box>
      {/* Global Filter */}
      {onGlobalFilterChange && (
        <Box mb={2}>
          <TextField
            placeholder="Search..."
            variant="outlined"
            size="small"
            value={globalFilter || ""}
            onChange={(e) => onGlobalFilterChange(e.target.value)}
            sx={{ width: 250 }}
          />
        </Box>
      )}

      {/* Main Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    sx={{
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? theme.palette.grey[900]
                          : theme.palette.grey[200],
                      cursor: header.column.getCanSort()
                        ? "pointer"
                        : "default",
                      fontWeight: 600,
                    }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getCanSort() && (
                      <Typography
                        component="span"
                        fontSize={12}
                        sx={{ ml: 0.5 }}
                      >
                        {{
                          asc: "🔼",
                          desc: "🔽",
                        }[header.column.getIsSorted()] ?? ""}
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2">Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2">No data found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} hover>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box
        mt={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            size="small"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || loading}
          >
            <NavigateBeforeIcon />
          </IconButton>
          <Typography variant="body2">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {manualPagination ? pageCount : table.getPageCount()}
          </Typography>
          <IconButton
            size="small"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || loading}
          >
            <NavigateNextIcon />
          </IconButton>
        </Box>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Rows per page</InputLabel>
          <Select
            label="Rows per page"
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              const value = Number(e.target.value);
              table.setPageSize(value);
              if (onPageSizeChange) onPageSizeChange(value);
            }}
          >
            {pageSizeOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}
