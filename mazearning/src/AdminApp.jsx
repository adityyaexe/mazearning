// mazearning/src/AdminApp.jsx
import React from "react";
import { Admin, Resource } from "react-admin";
import dataProvider from "./dataProvider";
import authProvider from "./authProvider";
import { UserList, UserEdit, UserCreate } from "./components/User";
import { AppList, AppEdit, AppCreate } from "./components/App";
import { AdList, AdEdit, AdCreate } from "./components/Ad";
import { useGetIdentity } from "react-admin";
import Dashboard from "./components/Dashboard";

function AdminResources() {
    const { data: identity, isLoading } = useGetIdentity();

    if (isLoading) return null;

    // Only admins can manage users, apps, and ads
    if (identity?.role === "admin") {
        return (
            <>
                <Resource name="users" list={UserList} edit={UserEdit} create={UserCreate} />
                <Resource name="apps" list={AppList} edit={AppEdit} create={AppCreate} />
                <Resource name="ads" list={AdList} edit={AdEdit} create={AdCreate} />
            </>
        );
    }

    // Moderators can only view apps and ads
    if (identity?.role === "moderator") {
        return (
            <>
                <Resource name="apps" list={AppList} />
                <Resource name="ads" list={AdList} />
            </>
        );
    }

    // Default: no access
    return null;
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
