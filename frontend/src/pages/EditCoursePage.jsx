import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminHeader from '../admin/AdminHeader';
import EditCourseView from '../admin/components/EditCourseView';
import courseService from '../services/courseService';

export default function EditCoursePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      // If id is provided, fetch or populate course
      (async () => {
        try {
          const res = await courseService.getAdminCourses({ search: id });
          if (res?.courses?.length) {
            setCourse(res.courses[0]);
          }
        } catch (e) {
          console.warn('Could not load course by ID:', e);
        }
      })();
    }
  }, [id]);

  const handleSave = async (payload) => {
    setLoading(true);
    try {
      if (course?._id) {
        await courseService.updateCourse(course._id, payload);
      }
      alert('Course updated successfully!');
      navigate('/admin');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update course.');
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
        <EditCourseView 
          course={course}
          onBack={() => navigate('/admin')}
          onSave={handleSave}
          loading={loading}
        />
      </div>
    </div>
  );
}
