// src/components/DataTable.jsx
import React from "react";
import DataTable from "react-data-table-component";

export default function CustomDataTable({ columns, data, ...props }) {
  return (
    <div style={{ width: "100%" }}>
      <DataTable
        columns={columns}
        data={data}
        pagination
        highlightOnHover
        responsive
        {...props}
      />
    </div>
  );
}
