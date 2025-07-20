// src/components/DataTable.jsx

import React, { memo } from "react";
import PropTypes from "prop-types";
import DataTable from "react-data-table-component";
import { CircularProgress, Box, Typography } from "@mui/material";

function CustomDataTable({ columns, data, loading = false, title, ...props }) {
  return (
    <Box sx={{ width: "100%" }}>
      <DataTable
        title={title}
        columns={columns}
        data={data}
        pagination
        highlightOnHover
        responsive
        persistTableHead
        aria-label="data table"
        progressPending={loading}
        progressComponent={
          <Box sx={{ py: 3, textAlign: "center" }}>
            <CircularProgress size={28} />
          </Box>
        }
        noDataComponent={
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No records found.
          </Typography>
        }
        {...props}
      />
    </Box>
  );
}

CustomDataTable.propTypes = {
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  title: PropTypes.string,
};

// ✅ Wrap with memo to prevent unnecessary renders
export default memo(CustomDataTable);
