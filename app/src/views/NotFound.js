import React from 'react';
import { Grid } from 'semantic-ui-react';
import ErrorMessage from '../components/ErrorMessage/ErrorMessage';

const NotFound = () => (
  <Grid centered padded>
    <Grid.Column>
      <ErrorMessage text="404 Page Not Found"/>
    </Grid.Column>
  </Grid>
);


export default NotFound;
