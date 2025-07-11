// mazearning/src/components/AppCard/AppCard.jsx
import React from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StarIcon from "@mui/icons-material/Star";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
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
  actionLabel = "Install",
  onFavorite,
  isFavorite = false,
  details = "",
}) {
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => setExpanded(!expanded);

  return (
    <Card sx={{ maxWidth: 345, margin: 2, boxShadow: 3 }}>
      <CardHeader
        avatar={
          icon ? (
            <img
              src={icon}
              alt={name}
              style={{ width: 40, height: 40, borderRadius: 8 }}
            />
          ) : null
        }
        title={name}
        subheader={`Size: ${size}`}
      />
      {icon && (
        <CardMedia
          component="img"
          height="140"
          image={icon}
          alt={name}
          sx={{ objectFit: "contain", background: "#f9f9f9" }}
        />
      )}
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {description}
        </Typography>
        <Typography variant="body2">
          <b>{points} mz pts</b> reward
        </Typography>
        <Typography variant="body2" sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
          <StarIcon fontSize="small" sx={{ color: "#FFD700", mr: 0.5 }} />
          {rating} | {completed} users completed
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <Button size="small" variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
        <IconButton onClick={onFavorite} aria-label="add to favorites" color={isFavorite ? "error" : "default"}>
          <FavoriteIcon />
        </IconButton>
        {details && (
          <ExpandMore
            expand={expanded}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
          >
            <ExpandMoreIcon />
          </ExpandMore>
        )}
      </CardActions>
      {details && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <Typography paragraph>{details}</Typography>
          </CardContent>
        </Collapse>
      )}
    </Card>
  );
}
