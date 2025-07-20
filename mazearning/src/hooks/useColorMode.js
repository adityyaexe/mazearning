// src/hooks/useColorMode.js
import { useContext } from "react";
import { ColorModeContext } from "../contexts/ColorModeContext";

// Custom hook to access color mode + toggle function
export const useColorMode = () => {
  return useContext(ColorModeContext);
};
