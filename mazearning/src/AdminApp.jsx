// mazearning/src/AdminApp.jsx

import React from "react";
import { Admin, Resource, useGetIdentity } from "react-admin";

import dataProvider from "./dataProvider";
import authProvider from "./authProvider";

import Dashboard from "./components/Dashboard";

// User Management (admin only)
import { UserList, UserEdit, UserCreate } from "./components/User";

// App Management (admin + moderator)
import { AppList, AppEdit, AppCreate } from "./components/App";

// Ad Management (admin + moderator)
import { AdList, AdEdit, AdCreate } from "./components/Ad";

// Optional: Fallback component if no access
const Unauthorized = () => (
  <div style={{ padding: 24, fontSize: 16 }}>
    🚫 Your account does not have permission to access the admin panel.
  </div>
);

function AdminResources() {
  const { data: identity, isLoading, error } = useGetIdentity();

  if (isLoading) return null;
  if (error || !identity) return <Unauthorized />;

  const role = identity?.role;

  switch (role) {
    case "admin":
      return (
        <>
          <Resource name="users" list={UserList} edit={UserEdit} create={UserCreate} />
          <Resource name="apps" list={AppList} edit={AppEdit} create={AppCreate} />
          <Resource name="ads" list={AdList} edit={AdEdit} create={AdCreate} />
        </>
      );
    case "moderator":
      return (
        <>
          <Resource name="apps" list={AppList} />
          <Resource name="ads" list={AdList} />
        </>
      );
    default:
      return <Unauthorized />;
  }
}

export default function AdminApp() {
  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      dashboard={Dashboard}
    >
      <AdminResources />
    </Admin>
  );
}
