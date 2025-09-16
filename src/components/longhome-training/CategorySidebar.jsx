import React from 'react';
import './RebuttalLibrary.css';

const CategorySidebar = ({ categories, collapsed, onCategoryClick, onCollapseChange, toggleCollapse, showCategoriesSidebar, setShowCategoriesSidebar }) => {
  return (
    <div
      className={`library-sidebar${collapsed ? ' collapsed' : ''}`}
      style={{
        width: collapsed ? 56 : 300,
        minWidth: collapsed ? 56 : 300,
        maxWidth: collapsed ? 56 : 300,
        padding: collapsed ? '16px 8px' : '24px',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflowX: 'hidden',
        alignItems: 'center',
        position: 'relative',
        left: 'auto',
        top: 'auto',
        height: 'auto',
        backgroundColor: 'transparent',
        zIndex: 'auto',
      }}
    >
      <button
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        onClick={toggleCollapse}
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: 'none',
          borderRadius: 8,
          color: '#fff',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          marginLeft: collapsed ? 0 : 'auto',
          marginRight: collapsed ? 0 : 0,
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        {collapsed ? (
          <span style={{ fontSize: 20 }}>▶</span>
        ) : (
          <span style={{ fontSize: 20 }}>◀</span>
        )}
      </button>
      <button
        onClick={() => setShowCategoriesSidebar((prev) => !prev)}
        style={{
          marginBottom: 12,
          padding: '4px 10px',
          borderRadius: 6,
          border: '1px solid #ccc',
          background: '#f8f9fa',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
          width: collapsed ? 32 : 'auto',
          height: collapsed ? 32 : 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={showCategoriesSidebar ? 'Hide Categories' : 'Show Categories'}
      >
        {collapsed ? '👁️' : (showCategoriesSidebar ? 'Hide' : 'Show')}
      </button>
      <div style={{ display: collapsed ? 'none' : 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2
          className="library-sidebar-title"
          style={{
            marginTop: 0,
            marginBottom: 0,
            fontSize: 20,
            fontWeight: 700,
            display: 'block',
          }}
        >
          Categories
        </h2>
      </div>
      <div className="library-categories" style={{ gap: 8 }}>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => onCategoryClick(category)}
            className={`library-category-button ${category.color}`}
            style={{
              width: '100%',
              textAlign: 'left',
              marginBottom: 4,
              padding: collapsed ? '12px 0' : '16px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 12,
              minHeight: 40,
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <span className="category-icon" style={{ fontSize: 20, width: 24, textAlign: 'center' }}>{category.icon}</span>
            {!collapsed && <span className="category-name">{category.name}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySidebar;