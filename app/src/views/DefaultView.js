import React from 'react';
import {Grid, Menu} from 'semantic-ui-react';
import SourcesList from '../components/SourcesList/SourcesList';
import {Switch, Route} from 'react-router-dom';
import NotFound from "./NotFound";
import ThreadsList from "../components/ThreadsList/ThreadsList";


const DefaultView = () => (
  <div style={{marginLeft: '15rem'}}>
    <Menu inverted fixed="top">
      <Menu.Item>
        <SourcesList/>
      </Menu.Item>
    </Menu>
    <Grid padded="horizontally" style={{paddingTop: '4em'}} verticalAlign="middle">
      <Grid.Column width={16}>
        <ThreadsList sourceUrl="https://2ch.hk/b/catalog_num.json"/>
      </Grid.Column>
    </Grid>
  </div>
);


export default DefaultView;
