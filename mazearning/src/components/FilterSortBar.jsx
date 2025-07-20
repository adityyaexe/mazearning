// mazearning/src/components/common/FilterSortBar.jsx

import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

export default function FilterSortBar({
  filter,
  setFilter,
  sort,
  setSort,
  filterOptions = [],
  sortOptions = [],
}) {
  return (
    <Box
      display="flex"
      flexWrap="wrap"
      gap={2}
      mb={2}
      sx={{ alignItems: "center" }}
    >
      <FormControl
        size="small"
        sx={{ minWidth: 140 }}
        aria-label="Filter by category"
      >
        <InputLabel>Filter</InputLabel>
        <Select
          value={filter ?? ""}
          label="Filter"
          onChange={(e) => setFilter(e.target.value)}
        >
          {filterOptions.length > 0 ? (
            filterOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No options</MenuItem>
          )}
        </Select>
      </FormControl>

      <FormControl
        size="small"
        sx={{ minWidth: 140 }}
        aria-label="Sort order"
      >
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sort ?? ""}
          label="Sort By"
          onChange={(e) => setSort(e.target.value)}
        >
          {sortOptions.length > 0 ? (
            sortOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No options</MenuItem>
          )}
        </Select>
      </FormControl>
    </Box>
  );
}

// ✅ Strong PropTypes for clarity and type safety
FilterSortBar.propTypes = {
  filter: PropTypes.string,
  setFilter: PropTypes.func.isRequired,
  sort: PropTypes.string,
  setSort: PropTypes.func.isRequired,
  filterOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  sortOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
};

FilterSortBar.defaultProps = {
  filter: "",
  sort: "",
  filterOptions: [],
  sortOptions: [],
};
