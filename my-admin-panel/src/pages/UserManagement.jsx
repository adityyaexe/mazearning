// my-admin-panel/src/pages/UserManagement.jsx
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
import Header from "../components/Header";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UserDialog from "../components/UserDialog";
import ConfirmationDialog from "../components/ConfirmationDialog";

const initialUsers = [
  { id: 1, name: "Alice Smith", email: "alice@example.com", role: "Admin" },
  { id: 2, name: "Bob Lee", email: "bob@site.com", role: "User" },
  { id: 3, name: "Carol King", email: "carol@co.com", role: "Support" },
  { id: 4, name: "David Kim", email: "david@test.com", role: "Admin" },
  { id: 5, name: "Emily Zhang", email: "emily@email.com", role: "User" },
  { id: 6, name: "Frank Williams", email: "frank@demo.com", role: "Support" },
];

const allRoles = ["All", "Admin", "User", "Support"];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Deletion Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUsers(initialUsers);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAdd = useCallback(() => {
    setEditUser(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((user) => {
    setEditUser(user);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    (user) => {
      setDialogOpen(false);
      if (editUser) {
        // Update existing user
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, ...user } : u))
        );
      } else {
        // Add new user with incremented id
        const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
        setUsers((prev) => [{ ...user, id: newId }, ...prev]);
      }
    },
    [editUser, users]
  );

  const openDeleteDialog = useCallback((user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      // Simulate API deletion or local update
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete?.id));
      setUserToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete user:", error);
      // You can add notification here if you have a notification system
    } finally {
      setIsDeleting(false);
    }
  }, [userToDelete]);

  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    if (role !== "All") {
      filtered = filtered.filter((u) => u.role === role);
    }
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(lowerSearch) ||
          u.email.toLowerCase().includes(lowerSearch)
      );
    }
    return filtered;
  }, [users, role, search]);

  const paginatedUsers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

  const handleChangePage = useCallback((_, newPage) => setPage(newPage), []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  return (
    <Box>
      <Header title="User Management" />

      <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={2} sx={{ width: 1 }}>
            <TextField
              select
              label="Role"
              value={role}
              size="small"
              onChange={(e) => {
                setRole(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 140 }}
              inputProps={{ "aria-label": "Filter users by role" }}
            >
              {allRoles.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              label="Search"
              variant="outlined"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Name or email"
              sx={{ flex: 1, minWidth: 200 }}
              inputProps={{ "aria-label": "Search users by name or email" }}
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
            onClick={handleAdd}
            aria-label="Add new user"
          >
            Add User
          </Button>
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress aria-label="Loading users" />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table aria-label="Users table">
                <TableHead>
                  <TableRow>
                    <TableCell><b>ID</b></TableCell>
                    <TableCell><b>Name</b></TableCell>
                    <TableCell><b>Email</b></TableCell>
                    <TableCell><b>Role</b></TableCell>
                    <TableCell align="right"><b>Actions</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((u) => (
                      <TableRow key={u.id} hover tabIndex={-1}>
                        <TableCell>{u.id}</TableCell>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title="Edit User">
                            <IconButton
                              color="primary"
                              onClick={() => handleEdit(u)}
                              aria-label={`Edit user ${u.name}`}
                              size="large"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete User">
                            <IconButton
                              color="error"
                              onClick={() => openDeleteDialog(u)}
                              aria-label={`Delete user ${u.name}`}
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
                        <Typography>No users found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredUsers.length > 0 && (
              <TablePagination
                component="div"
                count={filteredUsers.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage="Rows per page"
                aria-label="User table pagination"
              />
            )}
          </>
        )}
      </Paper>

      {/* Add/Edit User Dialog */}
      <UserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        user={editUser}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete User"
        message={`Are you sure you want to delete user "${userToDelete?.name}"?`}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Box>
  );
}
