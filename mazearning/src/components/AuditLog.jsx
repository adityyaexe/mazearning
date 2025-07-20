// mazearning/src/components/AuditLog.jsx

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box
} from "@mui/material";
import apiClient from "../api/apiClient";

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const response = await apiClient.get("/audit-logs");
        setLogs(response.data || []);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
        setError("Failed to load audit logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  return (
    <Card sx={{ maxWidth: "100%", mb: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Audit Log
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : logs.length === 0 ? (
          <Typography color="text.secondary">No recent activity found.</Typography>
        ) : (
          <List>
            {logs.map((log, index) => (
              <React.Fragment key={log._id || index}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={`${log.action} by ${log.user}`}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                        {log.details ? ` — ${log.details}` : ""}
                      </>
                    }
                  />
                </ListItem>
                {index < logs.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
