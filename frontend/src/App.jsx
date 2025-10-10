import React from 'react';
import EventList from './components/EventList.jsx';


export default function App() {
return (
<main>
<h1 id="page-title">TigerTix Events</h1>
<p aria-live="polite" aria-atomic="true" id="status-region" style={{position:'absolute', left:'-10000px'}}>
{/* Screen readers will announce dynamic updates */}
</p>
<EventList />
</main>
);
}
