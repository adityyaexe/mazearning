// src/components/App.js
import {
  List, Datagrid, TextField, NumberField, EditButton, DeleteButton,
  Edit, SimpleForm, TextInput, NumberInput, Create
} from 'react-admin';

export const AppList = props => (
  <List {...props}>
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
      <NumberField source="reward" />
      <TextField source="size" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const AppEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <NumberInput source="reward" />
      <TextInput source="size" />
    </SimpleForm>
  </Edit>
);

export const AppCreate = props => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <NumberInput source="reward" />
      <TextInput source="size" />
    </SimpleForm>
  </Create>
);
