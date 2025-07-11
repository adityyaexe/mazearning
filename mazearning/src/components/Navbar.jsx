// src/components/NavBar.jsx
import { NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <nav>
      <NavLink to="/" end>Home</NavLink>
      <NavLink to="/apps">Apps</NavLink>
      <NavLink to="/ads">Ads</NavLink>
      <NavLink to="/wallet">Wallet</NavLink>
      <NavLink to="/profile">Profile</NavLink>
    </nav>
  );
}
