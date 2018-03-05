import React from 'react';
import ThreadsListMain from '../components/ThreadsListMain/ThreadsListMain';


const ThreadsView = ({match: {params: {sourceId}}}) => (
  <ThreadsListMain sourceId={sourceId}/>
);


export default ThreadsView;
