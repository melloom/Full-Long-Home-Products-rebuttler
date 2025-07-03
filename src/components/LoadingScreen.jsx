import React from 'react';
import '../styles/LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        <div className="logo-container">
          <div className="logo-circle"></div>
          <div className="logo-text">
            <span>L</span>
            <span>H</span>
            <span>P</span>
          </div>
        </div>
        <div className="loading-animation">
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
        <div className="loading-text">
          <span>L</span>
          <span>o</span>
          <span>a</span>
          <span>d</span>
          <span>i</span>
          <span>n</span>
          <span>g</span>
          <span className="dot-1">.</span>
          <span className="dot-2">.</span>
          <span className="dot-3">.</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 