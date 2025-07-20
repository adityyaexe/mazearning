// my-admin-panel/src/pages/Customers.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Typography,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Stack,
  TablePagination,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Header from "../components/Header";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { useNotification } from "../contexts/NotificationContext";

const demoCustomers = [
  { id: 1, name: "Acme Corp", email: "contact@acme.com", status: "Active" },
  { id: 2, name: "Globex Inc", email: "info@globex.com", status: "Inactive" },
  { id: 3, name: "Soylent Corp", email: "sales@soylent.com", status: "Active" },
  { id: 4, name: "Initech", email: "support@initech.com", status: "Pending" },
  // Add more demo customers as needed
];

const allStatuses = ["All", "Active", "Inactive", "Pending"];

export default function Customers() {
  const { showNotification } = useNotification();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setCustomers(demoCustomers);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Filter and search customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    if (statusFilter !== "All") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (search.trim()) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.email.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [customers, statusFilter, search]);

  // Slice for pagination
  const paginatedCustomers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredCustomers.slice(start, start + rowsPerPage);
  }, [filteredCustomers, page, rowsPerPage]);

  // Pagination handlers
  const handleChangePage = useCallback((_, newPage) => setPage(newPage), []);
  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Confirmation dialog handlers
  const openDeleteDialog = useCallback((customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      // Replace with actual API call:
      // await apiClient.delete(`/customers/${customerToDelete.id}`);

      setCustomers((prev) =>
        prev.filter((c) => c.id !== customerToDelete.id)
      );

      showNotification({
        message: "Customer deleted successfully.",
        severity: "success",
      });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      showNotification({
        message: "Failed to delete customer.",
        severity: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [customerToDelete, showNotification]);

  // Placeholder handlers for view/edit
  const handleView = useCallback(
    (customer) => {
      showNotification({
        message: `View Customer: ${customer.name}`,
        severity: "info",
      });
    },
    [showNotification]
  );

  const handleEdit = useCallback(
    (customer) => {
      showNotification({
        message: `Edit Customer: ${customer.name}`,
        severity: "info",
      });
    },
    [showNotification]
  );

  return (
    <Box>
      <Header title="Customers" />
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={2} sx={{ width: 1 }}>
            <TextField
              size="small"
              label="Status"
              select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 140 }}
              inputProps={{ "aria-label": "Filter customers by status" }}
            >
              {allStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Search"
              variant="outlined"
              placeholder="Name or email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              sx={{ flex: 1, minWidth: 200 }}
              inputProps={{ "aria-label": "Search customers by name or email" }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearch("");
                  setPage(0);
                }
              }}
            />
          </Stack>
          <Button
            variant="contained"
            onClick={() =>
              showNotification({
                message: "Add Customer form TODO",
                severity: "info",
              })
            }
            aria-label="Add new customer"
          >
            Add Customer
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress aria-label="Loading customers" />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="Customers table">
                <TableHead>
                  <TableRow>
                    <TableCell><b>ID</b></TableCell>
                    <TableCell><b>Name</b></TableCell>
                    <TableCell><b>Email</b></TableCell>
                    <TableCell><b>Status</b></TableCell>
                    <TableCell align="right"><b>Actions</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCustomers.length ? (
                    paginatedCustomers.map((customer) => (
                      <TableRow key={customer.id} hover tabIndex={-1}>
                        <TableCell>{customer.id}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.status}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title="View Customer">
                            <IconButton
                              onClick={() => handleView(customer)}
                              aria-label={`View customer ${customer.name}`}
                              size="large"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Customer">
                            <IconButton
                              onClick={() => handleEdit(customer)}
                              aria-label={`Edit customer ${customer.name}`}
                              size="large"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Customer">
                            <IconButton
                              color="error"
                              onClick={() => openDeleteDialog(customer)}
                              aria-label={`Delete customer ${customer.name}`}
                              size="large"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography>No customers found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredCustomers.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Rows per page"
              aria-label="Customer table pagination"
            />
          </>
        )}
      </Paper>

      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${customerToDelete?.name}"?`}
        loading={isDeleting}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
}
