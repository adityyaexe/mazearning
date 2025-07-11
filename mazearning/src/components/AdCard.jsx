// src/components/AdCard.jsx
import React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import FavoriteIcon from "@mui/icons-material/Favorite";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import Box from "@mui/material/Box";

export default function AdCard({
  partnerIcon,
  partnerName,
  description,
  points,
  adType = "Video", // e.g., "Video", "Survey"
  completed,
  onWatch,
  onFavorite,
  isFavorite = false,
}) {
  return (
    <Card sx={{ maxWidth: 345, margin: 2, borderRadius: 3, boxShadow: 3 }}>
      <CardHeader
        avatar={
          partnerIcon ? (
            <CardMedia
              component="img"
              image={partnerIcon}
              alt={partnerName}
              sx={{ width: 40, height: 40, borderRadius: 2 }}
            />
          ) : (
            <OndemandVideoIcon sx={{ fontSize: 32, color: "#1976d2" }} />
          )
        }
        title={<Typography variant="h6">{partnerName}</Typography>}
        subheader={adType}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {description}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "#1976d2", my: 1 }}>
          +{points} mz pts
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {completed} users completed
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          size="small"
          color="primary"
          sx={{ borderRadius: 2, textTransform: "none" }}
          onClick={onWatch}
        >
          Watch Ad
        </Button>
        <IconButton
          onClick={onFavorite}
          aria-label="add to favorites"
          color={isFavorite ? "error" : "default"}
        >
          <FavoriteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}
