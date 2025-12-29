import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Lock } from 'lucide-react';
import ScheduleScript from './ScheduleScript';
import './ScheduleScript.css';

const ScheduleScriptComingSoon = () => {
  // Check if user is a developer (admin or in dev mode)
  const isDev = import.meta.env.DEV;
  const isAdmin = localStorage.getItem('adminUser') || localStorage.getItem('saasAdminUser');
  const canAccess = isDev || isAdmin;

  // If dev or admin, show the actual component
  if (canAccess) {
    return <ScheduleScript />;
  }

  // Otherwise show coming soon
  return (
    <div className="schedule-script-container-dark">
      <motion.div 
        className="schedule-script-content-dark"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            textAlign: 'center',
            padding: '3rem 2rem',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              padding: '0.75rem 1.5rem',
              borderRadius: '30px',
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '2rem',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Calendar size={24} />
            <span>Interactive Scheduling Script</span>
          </motion.div>

          <motion.div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '2rem',
              border: '3px solid rgba(59, 130, 246, 0.3)',
            }}
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          >
            <Lock size={48} color="#3b82f6" />
          </motion.div>

          <motion.h1
            style={{
              fontSize: '3rem',
              fontWeight: 800,
              color: '#f8fafc',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Coming Soon! 🚀
          </motion.h1>

          <motion.p
            style={{
              fontSize: '1.25rem',
              color: 'rgba(248, 250, 252, 0.8)',
              lineHeight: 1.7,
              maxWidth: '600px',
              margin: '0 auto 2rem auto',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            We're working hard to bring you an amazing interactive scheduling experience. 
            This feature is currently under development and will be available soon.
          </motion.p>

          <motion.div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: '2rem',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                padding: '1rem 1.5rem',
                color: '#3b82f6',
                fontSize: '0.9rem',
              }}
            >
              📅 Step-by-step scheduling guide
            </div>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                padding: '1rem 1.5rem',
                color: '#10b981',
                fontSize: '0.9rem',
              }}
            >
              🎯 Interactive call scripts
            </div>
            <div
              style={{
                background: 'rgba(147, 51, 234, 0.1)',
                border: '1px solid rgba(147, 51, 234, 0.2)',
                borderRadius: '12px',
                padding: '1rem 1.5rem',
                color: '#9333ea',
                fontSize: '0.9rem',
              }}
            >
              ✨ Smart appointment booking
            </div>
          </motion.div>

          <motion.p
            style={{
              marginTop: '3rem',
              fontSize: '0.9rem',
              color: 'rgba(248, 250, 252, 0.6)',
              fontStyle: 'italic',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            Stay tuned for updates!
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ScheduleScriptComingSoon;

