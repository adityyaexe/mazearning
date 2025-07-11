// mazearing/src/components/Wallet/WalletCard.jsx
import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import Box from "@mui/material/Box";

export default function WalletCard({
  balance,
  onConvert,
  onWithdraw,
  minWithdraw = 690,
}) {
  return (
    <Card sx={{ maxWidth: 340, margin: 2, boxShadow: 3, borderRadius: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <AccountBalanceWalletIcon sx={{ fontSize: 32, color: "#388e3c" }} />
          <Typography variant="h6" sx={{ ml: 1 }}>
            Wallet Balance
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#388e3c" }}>
          {balance} mz pts
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Minimum withdrawal: {minWithdraw} mz pts
        </Typography>
        <Button
          variant="outlined"
          size="small"
          sx={{ mr: 1, borderRadius: 2 }}
          onClick={onConvert}
        >
          Convert to ₹
        </Button>
        <Button
          variant="contained"
          size="small"
          color="success"
          sx={{ borderRadius: 2 }}
          onClick={onWithdraw}
          disabled={balance < minWithdraw}
        >
          Withdraw
        </Button>
      </CardContent>
    </Card>
  );
}
