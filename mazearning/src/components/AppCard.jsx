// mazearning/src/components/AppCard.jsx

import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Collapse,
  Button,
  IconButton,
  Typography,
} from "@mui/material";

import { styled } from "@mui/material/styles";

import FavoriteIcon from "@mui/icons-material/Favorite";
import StarIcon from "@mui/icons-material/Star";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// 🔧 Styled button to avoid prop leak to DOM
const ExpandMoreButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "expand",
})(({ theme, expand }) => ({
  transform: expand ? "rotate(180deg)" : "rotate(0deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
}));

export default function AppCard({
  icon,
  name,
  description,
  size,
  points,
  rating,
  completed,
  onAction,
  actionLabel,
  onFavorite,
  isFavorite,
  details,
}) {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card
      sx={{
        maxWidth: 345,
        width: "100%",
        mb: 3,
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <CardHeader
        avatar={
          icon ? (
            <CardMedia
              component="img"
              image={icon}
              alt={`${name} icon`}
              sx={{ width: 40, height: 40, borderRadius: "50%" }}
            />
          ) : (
            <StarIcon color="disabled" />
          )
        }
        title={
          <Typography variant="subtitle1" fontWeight={600}>
            {name}
          </Typography>
        }
        subheader={
          size ? (
            <Typography variant="caption" color="text.secondary">
              Size: {size}
            </Typography>
          ) : null
        }
      />

      <CardContent>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {description}
          </Typography>
        )}

        {Number.isFinite(points) && (
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
            +{points} mz pts reward
          </Typography>
        )}

        {(rating || completed) && (
          <Typography variant="caption" color="text.secondary">
            {rating ?? "—"} ★ &nbsp;|&nbsp; {completed ?? 0} users completed
          </Typography>
        )}
      </CardContent>

      <CardActions disableSpacing>
        <Button
          variant="contained"
          color="primary"
          onClick={onAction}
          size="small"
        >
          {actionLabel}
        </Button>

        <IconButton
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={onFavorite}
          color={isFavorite ? "secondary" : "default"}
        >
          <FavoriteIcon />
        </IconButton>

        {details && (
          <ExpandMoreButton
            expand={expanded}
            onClick={handleExpandClick}
            aria-label="Show more"
            aria-expanded={expanded}
          >
            <ExpandMoreIcon />
          </ExpandMoreButton>
        )}
      </CardActions>

      {details && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent sx={{ backgroundColor: "#fafafa" }}>
            <Typography variant="body2" paragraph>
              {details}
            </Typography>
          </CardContent>
        </Collapse>
      )}
    </Card>
  );
}

// ✅ Prop validation
AppCard.propTypes = {
  icon: PropTypes.string,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  size: PropTypes.string,
  points: PropTypes.number,
  rating: PropTypes.number,
  completed: PropTypes.number,
  onAction: PropTypes.func,
  actionLabel: PropTypes.string,
  onFavorite: PropTypes.func,
  isFavorite: PropTypes.bool,
  details: PropTypes.string,
};

// ✅ Default props
AppCard.defaultProps = {
  icon: "",
  description: "",
  size: null,
  points: 0,
  rating: null,
  completed: 0,
  onAction: () => {},
  actionLabel: "Install",
  onFavorite: () => {},
  isFavorite: false,
  details: "",
};
