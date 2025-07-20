// my-admin-panel/src/components/UserDialog.jsx
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";

const roles = ["Admin", "User", "Support"];

export default function UserDialog({ open, onClose, onSave, user }) {
  // Form state with validation errors
  const [form, setForm] = useState({ name: "", email: "", role: "User" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Refs to inputs to focus invalid field
  const nameRef = useRef();
  const emailRef = useRef();
  const roleRef = useRef();

  // Reset form when opened or user changes
  useEffect(() => {
    if (open) {
      setForm(user ?? { name: "", email: "", role: "User" });
      setErrors({});
      setLoading(false);
    }
  }, [open, user]);

  // Simple client-side validation
  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    // Basic email pattern check
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email address";

    if (!form.role) newErrors.role = "Role is required";

    setErrors(newErrors);
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    if (errors[name]) {
      // Re-validate this field on change if error was present
      setErrors((errs) => ({ ...errs, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      // Focus first invalid input
      if (validationErrors.name) nameRef.current?.focus();
      else if (validationErrors.email) emailRef.current?.focus();
      else if (validationErrors.role) roleRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      await onSave(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      aria-labelledby="user-dialog-title"
      aria-describedby="user-dialog-description"
      disableEscapeKeyDown={loading}
    >
      <DialogTitle id="user-dialog-title">{user ? "Edit User" : "Add User"}</DialogTitle>
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent dividers id="user-dialog-description">
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Name"
            fullWidth
            value={form.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            inputRef={nameRef}
            disabled={loading}
            required
            autoComplete="name"
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            fullWidth
            value={form.email}
            onChange={handleChange}
            type="email"
            error={!!errors.email}
            helperText={errors.email}
            inputRef={emailRef}
            disabled={loading || !!user} // disable if editing existing user
            required
            autoComplete="email"
          />
          <TextField
            select
            margin="dense"
            name="role"
            label="Role"
            fullWidth
            value={form.role}
            onChange={handleChange}
            error={!!errors.role}
            helperText={errors.role}
            inputRef={roleRef}
            disabled={loading}
            required
          >
            {roles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} type="button" disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" type="submit" disabled={loading}>
            {user ? "Save changes" : "Add User"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

UserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string,
  }),
};

UserDialog.defaultProps = {
  user: null,
};
