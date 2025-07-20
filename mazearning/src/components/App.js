// src/components/App.js

import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  EditButton,
  DeleteButton,
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  Create,
  BooleanField,
  BooleanInput
} from 'react-admin';

// ✅ List View (Admin Panel: All Apps Listing)
export const AppList = (props) => (
  <List {...props} title="App Listings">
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="name" label="App Name" />
      <TextField source="partner" label="Partner Name" />
      <NumberField source="points" label="Reward Points" />
      <NumberField source="completed" label="Completions" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

// ✅ Edit View (Admin Panel: Edit Single App)
export const AppEdit = (props) => (
  <Edit {...props} title="Edit App">
    <SimpleForm>
      <TextInput source="id" disabled fullWidth />
      <TextInput source="name" label="App Name" fullWidth />
      <TextInput source="partner" label="Partner Name" fullWidth />
      <NumberInput
        source="points"
        label="Reward Points"
        min={0}
        defaultValue={0}
        fullWidth
      />
      <NumberInput
        source="completed"
        label="Completions"
        min={0}
        defaultValue={0}
        fullWidth
      />
    </SimpleForm>
  </Edit>
);

// ✅ Create View (Admin Panel: Add New App)
export const AppCreate = (props) => (
  <Create {...props} title="Add New App">
    <SimpleForm>
      <TextInput source="name" label="App Name" fullWidth />
      <TextInput source="partner" label="Partner Name" fullWidth />
      <NumberInput
        source="points"
        label="Reward Points"
        min={0}
        defaultValue={0}
        fullWidth
      />
      <NumberInput
        source="completed"
        label="Completions"
        min={0}
        defaultValue={0}
        fullWidth
      />
    </SimpleForm>
  </Create>
);
