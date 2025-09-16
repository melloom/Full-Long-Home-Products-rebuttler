import React from 'react';
import '../styles/LoadingScreen.css';

const LoadingScreen = ({ variant = 'landing' }) => {
  const isCompany = variant === 'company';
  const rootClass = `loading-screen ${isCompany ? 'company' : 'landing'}`;

  return (
    <div className={rootClass}>
      <div className="loading-container">
        <div className="logo-container">
          <div className="logo-circle"></div>
          <div className="logo-text">
            {isCompany ? (
              <>
                <span>L</span>
                <span>H</span>
                <span>P</span>
              </>
            ) : (
              <>
                <span>S</span>
                <span>O</span>
                <span>S</span>
              </>
            )}
          </div>
          <div className="logo-subtext">
            {isCompany ? "Long Home Products" : ""}
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