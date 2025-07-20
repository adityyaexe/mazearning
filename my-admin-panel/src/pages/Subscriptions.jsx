// my-admin-panel/src/pages/Subscriptions.jsx
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

const demoSubscriptions = [
  {
    id: 1,
    customerName: "Acme Corp",
    plan: "Pro",
    status: "Active",
    startDate: "2023-01-15",
    endDate: "2024-01-15",
  },
  {
    id: 2,
    customerName: "Globex Inc",
    plan: "Basic",
    status: "Canceled",
    startDate: "2022-05-10",
    endDate: "2023-05-10",
  },
  {
    id: 3,
    customerName: "Initech",
    plan: "Enterprise",
    status: "Pending",
    startDate: "2023-06-01",
    endDate: "2024-06-01",
  },
  // Add more demo subscriptions as needed
];

const allStatuses = ["All", "Active", "Canceled", "Pending"];

export default function Subscriptions() {
  const { showNotification } = useNotification();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSubscriptions(demoSubscriptions);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter and search subscriptions
  const filteredSubs = useMemo(() => {
    let filtered = subscriptions;

    if (statusFilter !== "All") {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    if (search.trim()) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          sub.customerName.toLowerCase().includes(lower) ||
          sub.plan.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [subscriptions, statusFilter, search]);

  // Pagination slice
  const paginatedSubs = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredSubs.slice(start, start + rowsPerPage);
  }, [filteredSubs, page, rowsPerPage]);

  // Pagination handlers
  const handleChangePage = useCallback((_, newPage) => setPage(newPage), []);
  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // Delete dialog handlers
  const openDeleteDialog = useCallback((subscription) => {
    setSubscriptionToDelete(subscription);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSubscriptionToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      // TODO: Replace with your API call:
      // await apiClient.delete(`/subscriptions/${subscriptionToDelete.id}`);

      setSubscriptions((prev) =>
        prev.filter((sub) => sub.id !== subscriptionToDelete.id)
      );

      showNotification({
        message: "Subscription deleted successfully.",
        severity: "success",
      });
      setDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      showNotification({
        message: "Failed to delete subscription.",
        severity: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [subscriptionToDelete, showNotification]);

  // Placeholder handlers for view/edit
  const handleView = useCallback(
    (subscription) => {
      showNotification({
        message: `View Subscription: ${subscription.customerName} - ${subscription.plan}`,
        severity: "info",
      });
    },
    [showNotification]
  );

  const handleEdit = useCallback(
    (subscription) => {
      showNotification({
        message: `Edit Subscription: ${subscription.customerName} - ${subscription.plan}`,
        severity: "info",
      });
    },
    [showNotification]
  );

  return (
    <Box>
      <Header title="Subscriptions" />
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
              sx={{ minWidth: 160 }}
              inputProps={{ "aria-label": "Filter subscriptions by status" }}
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
              placeholder="Customer or Plan"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              sx={{ flex: 1, minWidth: 220 }}
              inputProps={{ "aria-label": "Search subscriptions by customer or plan" }}
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
                message: "Add Subscription form TODO",
                severity: "info",
              })
            }
            aria-label="Add new subscription"
          >
            Add Subscription
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress aria-label="Loading subscriptions" />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="Subscriptions table">
                <TableHead>
                  <TableRow>
                    <TableCell><b>ID</b></TableCell>
                    <TableCell><b>Customer</b></TableCell>
                    <TableCell><b>Plan</b></TableCell>
                    <TableCell><b>Status</b></TableCell>
                    <TableCell><b>Start Date</b></TableCell>
                    <TableCell><b>End Date</b></TableCell>
                    <TableCell align="right"><b>Actions</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedSubs.length ? (
                    paginatedSubs.map((sub) => (
                      <TableRow key={sub.id} hover tabIndex={-1}>
                        <TableCell>{sub.id}</TableCell>
                        <TableCell>{sub.customerName}</TableCell>
                        <TableCell>{sub.plan}</TableCell>
                        <TableCell>{sub.status}</TableCell>
                        <TableCell>{sub.startDate}</TableCell>
                        <TableCell>{sub.endDate}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title="View Subscription">
                            <IconButton
                              onClick={() => handleView(sub)}
                              aria-label={`View subscription for ${sub.customerName}`}
                              size="large"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Subscription">
                            <IconButton
                              onClick={() => handleEdit(sub)}
                              aria-label={`Edit subscription for ${sub.customerName}`}
                              size="large"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Subscription">
                            <IconButton
                              color="error"
                              onClick={() => openDeleteDialog(sub)}
                              aria-label={`Delete subscription for ${sub.customerName}`}
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
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography>No subscriptions found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredSubs.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Rows per page"
              aria-label="Subscription table pagination"
            />
          </>
        )}
      </Paper>

      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Subscription"
        message={`Are you sure you want to delete subscription of "${subscriptionToDelete?.customerName}"?`}
        loading={isDeleting}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
}
