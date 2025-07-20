// my-admin-panel/src/components/Header.jsx
import React from "react";
import { Box, Typography, Stack } from "@mui/material";

export default function Header({
  title,
  subtitle,
  mb = 3,
  px = 3,
  actions = null,
}) {
  return (
    <Box
      component="header"
      sx={{
        mb,
        px,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
      aria-label="Page header"
    >
      <Stack spacing={0.5}>
        <Typography
          variant={{ xs: "h5", sm: "h4" }}
          fontWeight="bold"
          component="h1"
          tabIndex={-1}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="subtitle1"
            color="text.secondary"
            component="p"
            aria-label="Page subtitle"
          >
            {subtitle}
          </Typography>
        )}
      </Stack>

      {actions && <Box>{actions}</Box>}
    </Box>
  );
}
