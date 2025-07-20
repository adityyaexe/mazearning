// mazearning/src/components/Profile/ProfileCard.jsx

import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Button,
  Chip,
  Box,
  useTheme,
} from "@mui/material";

import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import BlockIcon from "@mui/icons-material/Block";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

export default function ProfileCard({
  name,
  avatar,
  email,
  phone,
  kycStatus = "pending", // Options: "verified" | "pending" | "rejected"
  upi,
  bank,
  onKycAction,
  onLogout,
}) {
  const theme = useTheme();

  const kycMap = {
    verified: {
      label: "KYC Verified",
      color: "success",
      icon: <VerifiedUserIcon fontSize="small" />,
    },
    pending: {
      label: "KYC Pending",
      color: "warning",
      icon: <VerifiedUserIcon fontSize="small" />,
    },
    rejected: {
      label: "KYC Rejected",
      color: "error",
      icon: <BlockIcon fontSize="small" />,
    },
  };

  return (
    <Card
      sx={{
        maxWidth: 400,
        width: "100%",
        boxShadow: 3,
        borderRadius: 3,
        mx: "auto",
      }}
    >
      <CardHeader
        avatar={
          <Avatar
            src={avatar}
            alt={name}
            sx={{
              width: 56,
              height: 56,
              bgcolor: theme.palette.primary.main,
              fontSize: 28,
              textTransform: "uppercase",
            }}
          >
            {name?.charAt(0)}
          </Avatar>
        }
        title={
          <Typography variant="h6" fontWeight={700}>
            {name || "User"}
          </Typography>
        }
        subheader={
          <Chip
            label={kycMap[kycStatus]?.label}
            color={kycMap[kycStatus]?.color}
            icon={kycMap[kycStatus]?.icon}
            size="small"
            sx={{ fontSize: 13, fontWeight: 500 }}
          />
        }
      />

      <CardContent sx={{ pt: 0 }}>
        {email && (
          <Box display="flex" alignItems="center" mb={1}>
            <EmailIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="body2">{email}</Typography>
          </Box>
        )}

        {phone && (
          <Box display="flex" alignItems="center" mb={1}>
            <PhoneIcon sx={{ mr: 1, color: theme.palette.success.dark }} />
            <Typography variant="body2">{phone}</Typography>
          </Box>
        )}

        <Box display="flex" alignItems="center" mb={1}>
          <AccountBalanceIcon sx={{ mr: 1, color: "#6d4c41" }} />
          <Typography variant="body2">
            UPI: <b>{upi || "Not Linked"}</b>
          </Typography>
        </Box>

        <Box display="flex" alignItems="center">
          <AccountBalanceIcon sx={{ mr: 1, color: "#6d4c41" }} />
          <Typography variant="body2">
            Bank: <b>{bank || "Not Linked"}</b>
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
        {kycStatus !== "verified" && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={onKycAction}
          >
            Complete KYC
          </Button>
        )}
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={onLogout}
        >
          Logout
        </Button>
      </CardActions>
    </Card>
  );
}
