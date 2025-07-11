// src/pages/Apps.jsx
import React from 'react';
import ListingTable from "../components/ListingTable";
import InstallButton from "../components/InstallButton"; // Create this if needed

const columns = [
  {
    id: 'actions',
    key: "icon",
    label: "Icon",
    render: (row) => (
      <img
        src={row.icon}
        alt={row.name}
        style={{ width: 40, height: 40, borderRadius: 8 }}
      />
    ),
  },
  { key: "name", label: "App Name" },
  { key: "reward", label: "Reward" },
  { key: "size", label: "Size" },
  { key: "rating", label: "Rating" },
  { key: "completed", label: "Users" },
  {
    key: "action",
    label: "Action",
    render: (row) => (
      <InstallButton onClick={() => handleInstall(row)} />
    ),
  },
];

const appData = [
  {
    id: 1,
    icon: '/icons/app1.png',
    name: 'Super App',
    description: 'Earn by installing Super App!',
    size: '50MB',
    points: 100,
    rating: '4.5',
    completed: 1200,
  },
  {
    id: 2,
    icon: '/icons/app2.png',
    name: 'Mega App',
    description: 'Earn by installing Mega App!',
    size: '30MB',
    points: 80,
    rating: '4.2',
    completed: 950,
  },
  // Add more apps as needed
];

const data = appData.map(app => ({
  ...app,
  reward: `${app.points} mz pts`,
}));

function handleInstall(app) {
  // Implement install logic here
  console.log(`Install ${app.name}`);
}

export default function Apps() {
  return <ListingTable columns={columns} data={data} />;
}
