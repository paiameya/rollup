import React, {useEffect, useState} from 'react';
import './MasonryImageGrid.css';

const MasonryImageGrid = () => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      const res = await fetch('https://api.unsplash.com/photos/random?count=10', {
        headers: {
          Authorization: 'Client-ID elCwsRzPYZ6jPLBAQjYZ66Mw7h00YEhQVU1bG93zgVs',
        },
      });
      const data = await res.json();
      setImages(data);
    };

    fetchImages();
  }, []);

  return (
    <div className="masonry-grid">
      {images.map(image => (
        <div key={image.id} className="masonry-item">
          <img src={image.urls.small} alt={image.alt_description || 'Unsplash Image'} />
        </div>
      ))}
    </div>
  );
};

export default MasonryImageGrid;
