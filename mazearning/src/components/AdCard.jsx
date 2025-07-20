// src/components/AdCard.jsx

import React from "react";
import PropTypes from "prop-types";

import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  CardMedia,
  Button,
  Typography,
  IconButton,
  Box,
} from "@mui/material";

import FavoriteIcon from "@mui/icons-material/Favorite";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";

export default function AdCard({
  partnerIcon,
  partnerName,
  description,
  points = 0,
  adType = "Video", // e.g., "Video", "Survey"
  completed = 0,
  onWatch,
  onFavorite,
  isFavorite = false,
}) {
  return (
    <Card
      sx={{
        maxWidth: 345,
        width: "100%",
        borderRadius: 2,
        boxShadow: 3,
        mb: 3,
      }}
    >
      <CardHeader
        avatar={
          partnerIcon ? (
            <Box
              component="img"
              src={partnerIcon}
              alt={`${partnerName} logo`}
              sx={{ width: 40, height: 40, borderRadius: "50%" }}
            />
          ) : (
            <OndemandVideoIcon color="action" />
          )
        }
        title={
          <Typography variant="subtitle1" fontWeight={600}>
            {partnerName}
          </Typography>
        }
        subheader={<Typography variant="caption">Ad Type: {adType}</Typography>}
      />

      <CardMedia
        component="div"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 130,
          backgroundColor: "#f5f5f5",
        }}
      >
        {/* Placeholder: Show video/ad preview icon */}
        <OndemandVideoIcon sx={{ fontSize: 60, color: "#bdbdbd" }} />
      </CardMedia>

      <CardContent>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {description}
          </Typography>
        )}

        <Typography
          variant="subtitle2"
          color="primary"
          sx={{ fontWeight: 700, mb: 0.5 }}
        >
          +{points} mz pts
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {completed} users completed
        </Typography>
      </CardContent>

      <CardActions disableSpacing>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<OndemandVideoIcon />}
          onClick={onWatch}
        >
          Watch Ad
        </Button>

        <IconButton
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={onFavorite}
          color={isFavorite ? "secondary" : "default"}
        >
          <FavoriteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}

// ✅ Strong prop validation
AdCard.propTypes = {
  partnerIcon: PropTypes.string,
  partnerName: PropTypes.string.isRequired,
  description: PropTypes.string,
  points: PropTypes.number,
  adType: PropTypes.string,
  completed: PropTypes.number,
  onWatch: PropTypes.func,
  onFavorite: PropTypes.func,
  isFavorite: PropTypes.bool,
};
