// mazearning/src/components/QuickEarningCard.jsx
import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import FlashOnIcon from "@mui/icons-material/FlashOn";

export default function QuickEarningCard({
  title,
  points,
  onAction,
  icon = <FlashOnIcon sx={{ fontSize: 32, color: "#1976d2" }} />,
  description = "",
}) {
  return (
    <Card
      sx={{
        minWidth: 220,
        maxWidth: 260,
        margin: 1,
        boxShadow: 3,
        background: "linear-gradient(90deg, #e3f2fd 60%, #bbdefb 100%)",
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        {description && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {description}
          </Typography>
        )}
        <Typography
          variant="body1"
          sx={{
            fontWeight: 700,
            color: "#1976d2",
            my: 1,
            fontSize: "1.1rem",
          }}
        >
          +{points} mz pts
        </Typography>
        <Button
          variant="contained"
          size="small"
          color="primary"
          sx={{ mt: 1, borderRadius: 2, textTransform: "none" }}
          onClick={onAction}
        >
          Earn Now
        </Button>
      </CardContent>
    </Card>
  );
}
