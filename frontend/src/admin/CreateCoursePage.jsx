import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import CreateCourseView from './components/CreateCourseView';
import courseService from '../services/courseService';
import toast from 'react-hot-toast';

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSave = async (payload) => {
    setLoading(true);
    try {
      await courseService.createCourse(payload);
      toast.success('Course created successfully!');
      navigate('/admin');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <AdminHeader 
        onToggleSidebar={() => navigate('/admin')} 
      />
      <div className="flex-1">
        <CreateCourseView 
          onBack={() => navigate('/admin')}
          onSave={handleSave}
          loading={loading}
        />
      </div>
    </div>
  );
}
