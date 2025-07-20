// src/components/Table.jsx

import React from "react";
import PropTypes from "prop-types";

/**
 * Reusable HTML Table Component
 * @param {Array} theadData – Array of string headers.
 * @param {Array} tbodyData – Array of { id, items: [] } representing rows.
 * @param {string} customClass – Optional CSS class string.
 */
function Table({ theadData, tbodyData, customClass = "" }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className={customClass} role="table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {theadData.map((header, index) => (
              <th key={header || index} style={{ textAlign: "left", padding: "8px" }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tbodyData.length === 0 ? (
            <tr>
              <td colSpan={theadData.length} style={{ padding: "12px", textAlign: "center" }}>
                No records found.
              </td>
            </tr>
          ) : (
            tbodyData.map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {row.items.map((item, cellIndex) => (
                  <td key={cellIndex} style={{ padding: "8px", verticalAlign: "top" }}>
                    {item}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

Table.propTypes = {
  theadData: PropTypes.arrayOf(PropTypes.string).isRequired,
  tbodyData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      items: PropTypes.array.isRequired,
    })
  ).isRequired,
  customClass: PropTypes.string,
};

export default Table;
