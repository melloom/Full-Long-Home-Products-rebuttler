import React from 'react';
import '../styles/SearchBar.css';

const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  onKeyDown,
  className = '',
  autoFocus = false,
  ariaLabel = 'Search',
  ...props
}) => {
  return (
    <div className={`searchbar-container ${className}`}>
      <span className="searchbar-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <input
        type="text"
        className="searchbar-input"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        {...props}
      />
      {value && (
        <button
          type="button"
          className="searchbar-clear"
          onClick={onClear}
          aria-label="Clear search"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar; 