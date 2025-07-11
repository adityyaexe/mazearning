// mazearning/src/components/common/FilterSortBar.jsx
import React from "react";
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
    <Box display="flex" gap={2} mb={2}>
      <FormControl size="small">
        <InputLabel>Filter</InputLabel>
        <Select
          value={filter}
          label="Filter"
          onChange={(e) => setFilter(e.target.value)}
        >
          {filterOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small">
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sort}
          label="Sort By"
          onChange={(e) => setSort(e.target.value)}
        >
          {sortOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
