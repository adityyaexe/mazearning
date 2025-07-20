// src/pages/Surveys.jsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Alert,
  Button,
  Chip,
  useTheme,
} from "@mui/material";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import Header from "../components/Header";

export default function Surveys() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchSurveys() {
      setLoading(true);
      try {
        const res = await apiClient.get("/surveys");
        setSurveys(res.data || []);
        setError(false);
      } catch (err) {
        console.error("Failed to load surveys:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchSurveys();
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        px: { xs: 2, md: 4 },
        py: 4,
        boxSizing: "border-box",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <Header title="🧠 Available Surveys" />

      <Box
        sx={{
          maxWidth: 1200,
          width: "100%",
          mx: "auto",
        }}
      >
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid key={i} item xs={12} sm={6} md={4}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Skeleton variant="rectangular" height={30} width="70%" />
                    <Skeleton height={20} sx={{ mt: 1 }} />
                    <Skeleton width="50%" height={20} />
                    <Skeleton height={36} sx={{ mt: 2 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            ❌ Failed to load surveys. Please try again later.
          </Alert>
        ) : surveys.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            🕐 No surveys available right now. Check back again soon!
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {surveys.map((survey) => (
              <Grid key={survey.id} item xs={12} sm={6} md={4}>
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1.5}
                      mb={1.5}
                    >
                      <AssignmentIcon color="primary" fontSize="medium" />
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        noWrap
                        title={survey.title}
                      >
                        {survey.title}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, lineHeight: 1.45 }}
                    >
                      {survey.description}
                    </Typography>

                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Chip
                        icon={<EmojiEventsIcon />}
                        label={`${survey.reward} pts`}
                        color="success"
                        size="small"
                      />
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ fontWeight: 600, textTransform: "none" }}
                        onClick={() => navigate(`/surveys/${survey.id}`)}
                      >
                        Start
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
