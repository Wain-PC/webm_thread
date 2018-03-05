import React from 'react';
import Thread from '../components/Thread/Thread';


const ThreadsView = ({match: {params: {sourceId, threadId}}}) => (
  <Thread sourceId={sourceId} threadId={threadId}/>
);


export default ThreadsView;
