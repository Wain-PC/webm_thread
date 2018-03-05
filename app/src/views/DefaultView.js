import React from 'react';
import {Grid, Menu} from 'semantic-ui-react';
import SourcesList from '../components/SourcesList/SourcesList';


const DefaultView = () => (
  <div style={{marginLeft: '15rem'}}>
    <Menu inverted fixed="top">
      <Menu.Item>
        <SourcesList/>
      </Menu.Item>
    </Menu>
    <Grid padded="horizontally" style={{paddingTop: '4em'}} verticalAlign="middle">
      <Grid.Column width={16}>
        {/*List of videos here*/}
      </Grid.Column>
    </Grid>
  </div>
);


export default DefaultView;
