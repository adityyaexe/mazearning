// src/pages/Wallet.jsx

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Alert,
  useTheme,
  useMediaQuery,
  Paper,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

import apiClient from "../api/apiClient";
import { useNotification } from "../hooks/useNotification"; // use corrected import if moved
import Header from "../components/Header";
import ScrollToTop from "../components/ScrollToTop";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState("");

  const { showNotification } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ✅ useCallback fixes exhaustive-deps warning
  const fetchWallet = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/wallet");
      setBalance(res?.data?.balance || 0);
      setTransactions(res?.data?.transactions || []);
    } catch (err) {
      console.error("Fetch wallet failed:", err); // ✅ using 'err'
      setError("Failed to load wallet data.");
      showNotification("Failed to load wallet data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleWithdraw = async () => {
    setTxLoading(true);
    try {
      await apiClient.post("/wallet/withdraw", { amount: balance });
      showNotification("Withdrawal requested!", "success");
      await fetchWallet();
    } catch (err) {
      console.error("Withdrawal error:", err);
      showNotification("Withdrawal failed.", "error");
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <>
      <ScrollToTop />

      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: 4,
          width: "100%",
          maxWidth: "1400px",
          mx: "auto",
          minHeight: "100vh",
          bgcolor: theme.palette.background.default,
          color: theme.palette.text.primary,
        }}
      >
        <Header title="💰 My Wallet" />

        <Paper
          elevation={3}
          sx={{
            borderRadius: 3,
            p: { xs: 2, md: 4 },
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Grid container spacing={3}>
            {/* Wallet Balance */}
            <Grid item xs={12} md={6}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  bgcolor: theme.palette.mode === "dark" ? "#1e1e1e" : "#f4f6f8",
                }}
              >
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Current Balance
                  </Typography>

                  {loading ? (
                    <CircularProgress />
                  ) : error ? (
                    <Alert severity="error" sx={{ my: 1 }}>
                      {error}
                    </Alert>
                  ) : (
                    <Typography
                      variant={isMobile ? "h4" : "h3"}
                      fontWeight={700}
                      sx={{ my: 1 }}
                    >
                      ₹{balance.toLocaleString()}
                    </Typography>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
                    onClick={handleWithdraw}
                    disabled={loading || txLoading || balance <= 0}
                  >
                    {txLoading ? "Processing..." : "Withdraw"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Info Card */}
            <Grid item xs={12} md={6}>
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Info
                  </Typography>
                  <Typography variant="body2" mt={1}>
                    Complete tasks, watch ads, and install apps to earn Maze Tokens.
                    Accumulate your balance and request withdrawals anytime from here.
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    mt={2}
                    color="text.secondary"
                  >
                    🔁 Withdrawals are usually processed within 24 hours.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Transaction History */}
          <Box mt={6}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              Recent Transactions
            </Typography>

            {loading ? (
              <CircularProgress />
            ) : transactions.length === 0 ? (
              <Typography color="text.secondary">
                No transaction history available.
              </Typography>
            ) : (
              <Card elevation={2} sx={{ borderRadius: 3, overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? theme.palette.grey[900]
                            : theme.palette.grey[100],
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Amount (₹)
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id || tx._id}>
                        <TableCell>
                          {new Date(tx.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{tx.type}</TableCell>
                        <TableCell>{tx.description}</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 600,
                            color:
                              tx.amount > 0
                                ? "success.main"
                                : "error.main",
                          }}
                        >
                          {tx.amount > 0 ? "+" : "-"} ₹{Math.abs(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <Typography
                            fontWeight={600}
                            fontSize={13}
                            sx={{
                              color:
                                tx.status === "completed"
                                  ? "success.main"
                                  : tx.status === "pending"
                                    ? "warning.main"
                                    : "error.main",
                              textTransform: "capitalize",
                            }}
                          >
                            {tx.status}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </Box>
        </Paper>
      </Box>
    </>
  );
}
