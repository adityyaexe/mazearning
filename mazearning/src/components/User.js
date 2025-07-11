// mazearning/src/components/User.js
import {
  List, Datagrid, TextField, EmailField, EditButton, DeleteButton,
  Edit, SimpleForm, TextInput, EmailInput, Create
} from 'react-admin';

// List view
export const UserList = props => (
  <List {...props}>
    <Datagrid>
      <TextField source="id" />
      <TextField source="name" />
      <EmailField source="email" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

// Edit view
export const UserEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <EmailInput source="email" />
    </SimpleForm>
  </Edit>
);

// Create view
export const UserCreate = props => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <EmailInput source="email" />
      <TextInput source="password" type="password" />
    </SimpleForm>
  </Create>
);
