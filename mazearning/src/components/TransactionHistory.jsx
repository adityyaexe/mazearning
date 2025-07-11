// mazearning/src/components/wallet/TransactionHistory.jsx
import React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const statusMap = {
  success: { label: "Completed", color: "success", icon: <CheckCircleIcon fontSize="small" /> },
  pending: { label: "Pending", color: "warning", icon: <HourglassEmptyIcon fontSize="small" /> },
  failed: { label: "Failed", color: "error", icon: <CancelIcon fontSize="small" /> },
};

const typeMap = {
  earn: { icon: <MonetizationOnIcon sx={{ color: "#1976d2" }} />, label: "Earned" },
  convert: { icon: <ArrowUpwardIcon sx={{ color: "#388e3c" }} />, label: "Converted" },
  withdraw: { icon: <ArrowDownwardIcon sx={{ color: "#f44336" }} />, label: "Withdrawn" },
};

export default function TransactionHistory({ transactions = [] }) {
  return (
    <List sx={{ width: "100%", maxWidth: 420, bgcolor: "background.paper", borderRadius: 2, boxShadow: 2 }}>
      {transactions.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
          No transactions yet.
        </Typography>
      )}
      {transactions.map((tx, idx) => (
        <ListItem key={idx} divider>
          <ListItemAvatar>
            <Avatar>
              {typeMap[tx.type]?.icon}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={`${typeMap[tx.type]?.label || "Transaction"}: ${tx.amount} mz pts`}
            secondary={new Date(tx.date).toLocaleString()}
          />
          <Chip
            label={statusMap[tx.status]?.label || tx.status}
            color={statusMap[tx.status]?.color || "default"}
            icon={statusMap[tx.status]?.icon}
            size="small"
            sx={{ minWidth: 100 }}
          />
        </ListItem>
      ))}
    </List>
  );
}
