import React from 'react';
import MasonryImageGrid from './components/MasonryImageGrid.jsx';

function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
      }}>
      <h1>Random Unsplash Image Grid</h1>
      <MasonryImageGrid />
    </div>
  );
}

export default App;
