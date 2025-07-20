// src/pages/QuickEarn.jsx

import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
} from "@mui/material";

import AssignmentIcon from "@mui/icons-material/Assignment";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import CasinoIcon from "@mui/icons-material/Casino";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useNavigate } from "react-router-dom";

export default function QuickEarn() {
  const navigate = useNavigate();

  const tasks = [
    {
      id: "survey",
      title: "Daily Survey",
      description: "Earn up to 50 mz pts by completing a short survey.",
      icon: <AssignmentIcon color="primary" fontSize="large" />,
      actionText: "Start Survey",
      onClick: () => navigate("/quick-earn/survey"),
    },
    {
      id: "quiz",
      title: "Pop Quiz",
      description: "Answer 5 simple questions and earn rewards.",
      icon: <CheckCircleOutlineIcon color="success" fontSize="large" />,
      actionText: "Take Quiz",
      onClick: () => navigate("/quick-earn/quiz"),
    },
    {
      id: "spin",
      title: "Spin & Win",
      description: "Try your luck! Spin to win up to 100 pts.",
      icon: <CasinoIcon color="secondary" fontSize="large" />,
      actionText: "Spin Now",
      onClick: () => navigate("/quick-earn/spin"),
    },
    {
      id: "scratch",
      title: "Scratch Card",
      description: "Scratch to reveal earnings up to 500 mz pts.",
      icon: <SportsEsportsIcon color="warning" fontSize="large" />,
      actionText: "Scratch Now",
      onClick: () => navigate("/quick-earn/scratch"),
    },
  ];

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        🎯 Quick Earn Tasks
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Complete any of the tasks below and earn Maze Rewards instantly!
      </Typography>

      <Grid container spacing={3}>
        {tasks.map((task) => (
          <Grid key={task.id} item xs={12} sm={6} md={3}>
            <Card
              elevation={3}
              sx={{
                borderRadius: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 5,
                },
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  mb={1}
                  aria-label={`${task.title} task icon and title`}
                >
                  {task.icon}
                  <Typography variant="subtitle1" fontWeight={600}>
                    {task.title}
                  </Typography>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ flexGrow: 1, mb: 2 }}
                >
                  {task.description}
                </Typography>

                <Button
                  variant="outlined"
                  fullWidth
                  size="small"
                  onClick={task.onClick}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  {task.actionText}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
