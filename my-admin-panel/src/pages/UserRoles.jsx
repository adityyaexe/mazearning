// my-admin-panel/src/pages/UserRoles.jsx
import React, { useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Header from "../components/Header";

const initialRoles = ["Admin", "User", "Support"];

export default function UserRoles() {
  const [roles, setRoles] = useState(initialRoles);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRoleIndex, setEditRoleIndex] = useState(null);
  const [roleName, setRoleName] = useState("");

  const openAddDialog = useCallback(() => {
    setEditRoleIndex(null);
    setRoleName("");
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((index) => {
    setEditRoleIndex(index);
    setRoleName(roles[index]);
    setDialogOpen(true);
  }, [roles]);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setRoleName("");
    setEditRoleIndex(null);
  }, []);

  const handleSaveRole = useCallback(() => {
    if (!roleName.trim()) return;

    setRoles((prev) => {
      const updated = [...prev];
      if (editRoleIndex !== null) {
        updated[editRoleIndex] = roleName.trim();
      } else {
        if (prev.includes(roleName.trim())) return prev; // Prevent duplicates
        updated.push(roleName.trim());
      }
      return updated;
    });

    handleCloseDialog();
  }, [editRoleIndex, roleName, handleCloseDialog]);

  const handleDeleteRole = useCallback(
    (index) => {
      setRoles((prev) => prev.filter((_, i) => i !== index));
    },
    []
  );

  return (
    <Box>
      <Header title="User Roles" />

      <Paper sx={{ p: 3, maxWidth: 600, mt: 2, mx: "auto" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="h2">
            Manage User Roles
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Add Role
          </Button>
        </Stack>

        {roles.length === 0 ? (
          <Typography>No roles defined. Please add new roles.</Typography>
        ) : (
          <List>
            {roles.map((role, index) => (
              <ListItem key={role} divider>
                <ListItemText primary={role} />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label={`Edit role ${role}`}
                    onClick={() => openEditDialog(index)}
                    size="large"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label={`Delete role ${role}`}
                    onClick={() => handleDeleteRole(index)}
                    size="large"
                    sx={{ ml: 1, color: "error.main" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        {/* Add/Edit Role Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
          <DialogTitle>{editRoleIndex !== null ? "Edit Role" : "Add Role"}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Role Name"
              fullWidth
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveRole(); } }}
              required
              inputProps={{ "aria-label": "Role name input" }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSaveRole} variant="contained" disabled={!roleName.trim()}>
              {editRoleIndex !== null ? "Save Changes" : "Add Role"}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
