// my-admin-panel/src/pages/AuditTrail.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import Header from "../components/Header";

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/logs");
      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message || "Failed to fetch logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formattedLogs = useMemo(() => {
    return logs.map((log, index) => ({
      key: log.id || `${log.timestamp}-${index}`, // fallback key
      ...log,
      formattedDate: new Date(log.timestamp).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    }));
  }, [logs]);

  return (
    <Box>
      <Header title="Audit Trail" />
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="flex-end" mb={2}>
          <Button
            variant="outlined"
            onClick={fetchLogs}
            startIcon={<RefreshIcon />}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ p: 2 }}>
            {error}
          </Typography>
        ) : logs.length === 0 ? (
          <Typography align="center" sx={{ p: 2, fontStyle: "italic" }}>
            No logs found.
          </Typography>
        ) : (
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader aria-label="audit trail logs table" size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formattedLogs.map(({ key, formattedDate, username, action, details }) => (
                  <TableRow key={key} hover tabIndex={-1}>
                    <TableCell>{formattedDate}</TableCell>
                    <TableCell>{username}</TableCell>
                    <TableCell>{action}</TableCell>
                    <TableCell sx={{ whiteSpace: "pre-line" }}>{details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
