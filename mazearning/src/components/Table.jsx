// src/components/Table.jsx
import React from "react";

function Table({ theadData, tbodyData, customClass = "" }) {
  return (
    <table className={customClass}>
      <thead>
        <tr>
          {theadData.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tbodyData.map((row) => (
          <tr key={row.id}>
            {row.items.map((item, idx) => (
              <td key={idx}>{item}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;
