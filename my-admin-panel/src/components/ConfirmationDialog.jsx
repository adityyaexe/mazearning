// my-admin-panel/src/components/ConfirmationDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Box,
} from "@mui/material";

export default function ConfirmationDialog({
  open,
  title = "Confirm action",
  message = "Are you sure you want to proceed?",
  onConfirm,
  onCancel,
  loading = false,
  cancelColor = "primary",
  confirmColor = "error",
  confirmText = "Confirm",
  cancelText = "Cancel",
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? null : onCancel}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      disableEscapeKeyDown={loading}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent dividers>
        <DialogContentText id="confirmation-dialog-description" tabIndex={-1}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color={cancelColor} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          disabled={loading}
          startIcon={
            loading && (
              <Box sx={{ display: "flex" }}>
                <CircularProgress color="inherit" size={16} />
              </Box>
            )
          }
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
