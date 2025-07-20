// mazearning/src/components/wallet/TransactionHistory.jsx

import React from "react";
import {
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Chip,
  Box,
} from "@mui/material";

import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const statusMap = {
  success: {
    label: "Completed",
    color: "success",
    icon: <CheckCircleIcon fontSize="small" />,
  },
  pending: {
    label: "Pending",
    color: "warning",
    icon: <HourglassEmptyIcon fontSize="small" />,
  },
  failed: {
    label: "Failed",
    color: "error",
    icon: <CancelIcon fontSize="small" />,
  },
};

const typeMap = {
  earn: {
    icon: <MonetizationOnIcon sx={{ color: "#1976d2" }} />,
    label: "Earned",
  },
  convert: {
    icon: <ArrowUpwardIcon sx={{ color: "#388e3c" }} />,
    label: "Converted",
  },
  withdraw: {
    icon: <ArrowDownwardIcon sx={{ color: "#f44336" }} />,
    label: "Withdrawn",
  },
};

export default function TransactionHistory({ transactions = [] }) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 420,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 2,
        overflow: "hidden",
      }}
    >
      <List dense disablePadding>
        {transactions.length === 0 ? (
          <ListItem>
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", width: "100%" }}
                >
                  No transactions yet.
                </Typography>
              }
            />
          </ListItem>
        ) : (
          transactions.map((tx, idx) => {
            const type = typeMap[tx.type] || {};
            const status = statusMap[tx.status] || {
              label: tx.status,
              color: "default",
            };

            return (
              <ListItem key={tx.id || idx} divider>
                <ListItemAvatar>
                  <Avatar>{type.icon}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={600}>
                      {type.label || "Transaction"}:{" "}
                      {tx.amount?.toLocaleString() ?? "—"} mz pts
                    </Typography>
                  }
                  secondary={
                    tx.date ? new Date(tx.date).toLocaleString() : "Unknown date"
                  }
                />
                <Chip
                  label={status.label}
                  color={status.color}
                  icon={status.icon}
                  size="small"
                  sx={{ minWidth: 100 }}
                />
              </ListItem>
            );
          })
        )}
      </List>
    </Box>
  );
}
