// src/hooks/useAuth.js

import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

// Custom hook to access auth values
export const useAuth = () => useContext(AuthContext);
