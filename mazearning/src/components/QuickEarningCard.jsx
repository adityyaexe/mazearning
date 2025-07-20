// mazearning/src/components/QuickEarningCard.jsx

import React from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  Button,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";

export default function QuickEarningCard({
  title,
  points = 0,
  onAction,
  icon,
  description = "",
}) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        minWidth: 220,
        maxWidth: 260,
        m: 1,
        p: 1,
        boxShadow: 3,
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: theme.palette.mode === "dark"
          ? "linear-gradient(90deg, #263238 60%, #37474f 100%)"
          : "linear-gradient(90deg, #e3f2fd 60%, #bbdefb 100%)",
      }}
    >
      <CardContent>
        {/* Top Area: Icon + Title */}
        <Box display="flex" alignItems="center" mb={1}>
          {icon || (
            <FlashOnIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
          )}
          <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>

        {/* Description */}
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
            sx={{ minHeight: 32 }}
          >
            {description}
          </Typography>
        )}

        {/* Points */}
        <Typography
          variant="body1"
          sx={{
            fontWeight: 700,
            color: theme.palette.primary.main,
            my: 1,
            fontSize: "1.1rem",
          }}
        >
          +{points} mz pts
        </Typography>

        {/* CTA */}
        <Button
          variant="contained"
          size="small"
          color="primary"
          fullWidth
          onClick={onAction}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Earn Now
        </Button>
      </CardContent>
    </Card>
  );
}
