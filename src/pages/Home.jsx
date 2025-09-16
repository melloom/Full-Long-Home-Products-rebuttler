import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure company context defaults to Long Home when this page is used as company landing
    try {
      const slug = localStorage.getItem('currentCompanySlug');
      if (!slug) localStorage.setItem('currentCompanySlug', 'long-home');
    } catch (_) {}
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center p-8">
        
        <button
          onClick={() => navigate('/rebuttals')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-4 rounded-lg shadow-lg transform transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          Go to Rebuttals →
        </button>
      </div>
    </div>
  );
}