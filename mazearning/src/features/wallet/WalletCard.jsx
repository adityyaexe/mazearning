// src/features/wallet/WalletCard.jsx

import React from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  useTheme,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

export default function WalletCard({
  balance = 0,
  onConvert,
  onWithdraw,
  minWithdraw = 690,
}) {
  const theme = useTheme();
  const isEligibleForWithdraw = balance >= minWithdraw;

  return (
    <Card
      sx={{
        maxWidth: 360,
        width: "100%",
        mx: "auto",
        boxShadow: 3,
        borderRadius: 3,
      }}
    >
      <CardContent>
        {/* Header: Icon + Label */}
        <Box display="flex" alignItems="center" mb={2}>
          <AccountBalanceWalletIcon
            sx={{ fontSize: 32, color: theme.palette.success.main }}
          />
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
            Wallet Balance
          </Typography>
        </Box>

        {/* Balance */}
        <Typography
          variant="h4"
          fontWeight={800}
          color="success.main"
          sx={{ mb: 0.5 }}
        >
          {balance.toLocaleString()} mz pts
        </Typography>

        {/* Minimum Withdraw Info */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Minimum withdrawal: {minWithdraw.toLocaleString()} mz pts
        </Typography>

        {/* CTA Buttons */}
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            fullWidth
            sx={{ borderRadius: 2, textTransform: "none" }}
            onClick={onConvert}
          >
            Convert to ₹
          </Button>
          <Button
            variant="contained"
            size="small"
            color="success"
            fullWidth
            sx={{ borderRadius: 2, textTransform: "none" }}
            onClick={onWithdraw}
            disabled={!isEligibleForWithdraw}
          >
            Withdraw
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
