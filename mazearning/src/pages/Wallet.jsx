    // src/pages/Wallet.jsx
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Button,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import apiClient from "../api/apiClient";
import { useNotification } from "../contexts/NotificationContext";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState("");
  const { showNotification } = useNotification();

  useEffect(() => {
    async function fetchWallet() {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.get("/api/auth/wallet");
        setBalance(res.data.balance ?? 0);
        setTransactions(res.data.transactions ?? []);
      } catch {
        setError("Failed to load wallet data.");
        showNotification("Failed to load wallet data.", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchWallet();
  }, [showNotification]);

  const handleWithdraw = async () => {
    setTxLoading(true);
    try {
      await apiClient.post("/wallet/withdraw", { amount: balance });
      showNotification("Withdrawal requested!", "success");
      // Optionally refresh wallet data
    } catch {
      showNotification("Withdrawal failed.", "error");
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        <AccountBalanceWalletIcon sx={{ fontSize: 36, verticalAlign: "middle", mr: 1 }} />
        My Wallet
      </Typography>

      <Grid container columns={12} spacing={2}>
        <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Current Balance
              </Typography>
              {loading ? (
                <CircularProgress />
              ) : error ? (
                <Typography color="error">{error}</Typography>
              ) : (
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  ₹{balance}
                </Typography>
              )}
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={handleWithdraw}
                disabled={loading || txLoading || balance <= 0}
              >
                {txLoading ? "Processing..." : "Withdraw"}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Info
              </Typography>
              <Typography variant="body2">
                Earn points by completing offers and convert them to cash! Withdrawals are processed within 24 hours.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Recent Transactions
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : transactions.length === 0 ? (
          <Typography color="textSecondary">No transactions yet.</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount (₹)</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                  <TableCell>{tx.type}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell align="right" style={{ color: tx.amount > 0 ? "#388e3c" : "#d32f2f" }}>
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={
                        tx.status === "completed"
                          ? "success.main"
                          : tx.status === "pending"
                          ? "warning.main"
                          : "error.main"
                      }
                    >
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </Box>
  );
}
