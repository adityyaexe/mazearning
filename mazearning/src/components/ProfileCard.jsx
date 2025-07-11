// mazearning/src/components/Profile/ProfileCard.jsx
import React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import BlockIcon from "@mui/icons-material/Block";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import Box from "@mui/material/Box";

export default function ProfileCard({
  name,
  avatar,
  email,
  phone,
  kycStatus = "pending", // "verified" | "pending" | "rejected"
  upi,
  bank,
  onKycAction,
  onLogout,
}) {
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
    <Card sx={{ maxWidth: 390, margin: 2, boxShadow: 3, borderRadius: 3 }}>
      <CardHeader
        avatar={
          <Avatar
            src={avatar}
            alt={name}
            sx={{ width: 56, height: 56, bgcolor: "#1976d2", fontSize: 28 }}
          >
            {name?.[0]}
          </Avatar>
        }
        title={
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {name}
          </Typography>
        }
        subheader={
          <Chip
            label={kycMap[kycStatus]?.label}
            color={kycMap[kycStatus]?.color}
            icon={kycMap[kycStatus]?.icon}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        }
      />
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <EmailIcon sx={{ mr: 1, color: "#1976d2" }} />
          <Typography variant="body2">{email}</Typography>
        </Box>
        <Box display="flex" alignItems="center" mb={1}>
          <PhoneIcon sx={{ mr: 1, color: "#388e3c" }} />
          <Typography variant="body2">{phone}</Typography>
        </Box>
        <Box display="flex" alignItems="center" mb={1}>
          <AccountBalanceIcon sx={{ mr: 1, color: "#6d4c41" }} />
          <Typography variant="body2">
            UPI: <b>{upi || "Not linked"}</b>
          </Typography>
        </Box>
        <Box display="flex" alignItems="center">
          <AccountBalanceIcon sx={{ mr: 1, color: "#6d4c41" }} />
          <Typography variant="body2">
            Bank: <b>{bank || "Not linked"}</b>
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
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
