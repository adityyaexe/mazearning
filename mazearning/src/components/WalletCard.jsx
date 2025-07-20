// mazearning/src/components/Wallet/WalletCard.jsx

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
  const isEligible = balance >= minWithdraw;

  return (
    <Card
      sx={{
        maxWidth: 340,
        width: "100%",
        m: 2,
        boxShadow: 3,
        borderRadius: 3,
      }}
    >
      <CardContent>
        {/* Wallet header */}
        <Box display="flex" alignItems="center" mb={2}>
          <AccountBalanceWalletIcon
            sx={{ fontSize: 32, color: theme.palette.success.main }}
          />
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
            Wallet Balance
          </Typography>
        </Box>

        {/* Wallet balance */}
        <Typography
          variant="h4"
          fontWeight={800}
          color="success.main"
          sx={{ mb: 0.5 }}
        >
          {balance.toLocaleString()} mz pts
        </Typography>

        {/* Minimum withdraw info */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Minimum withdrawal: {minWithdraw.toLocaleString()} mz pts
        </Typography>

        {/* Action buttons */}
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2, textTransform: "none" }}
            onClick={onConvert}
          >
            Convert to ₹
          </Button>
          <Button
            variant="contained"
            size="small"
            color="success"
            disabled={!isEligible}
            sx={{ borderRadius: 2, textTransform: "none" }}
            onClick={onWithdraw}
          >
            Withdraw
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// ✅ PropTypes declaration
WalletCard.propTypes = {
  balance: PropTypes.number.isRequired,
  onConvert: PropTypes.func.isRequired,
  onWithdraw: PropTypes.func.isRequired,
  minWithdraw: PropTypes.number,
};
