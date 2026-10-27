import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import CourseDetailsView from './components/CourseDetailsView';
import courseService from '../services/courseService';
import toast from 'react-hot-toast';

export default function ViewCoursePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      (async () => {
        try {
          setLoading(true);
          const res = await courseService.getCourse(id);
          if (res?.course) {
            setCourse(res.course);
          } else {
            // Fallback search admin courses
            const adminRes = await courseService.getAdminCourses({ search: id });
            if (adminRes?.courses?.length) {
              setCourse(adminRes.courses[0]);
            }
          }
        } catch (e) {
          console.warn('Could not load course by ID:', e);
          toast.error('Could not load course information.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [id]);

  const handleDelete = async (courseToDelete) => {
    if (!window.confirm(`Are you sure you want to delete "${courseToDelete?.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await courseService.deleteCourse(courseToDelete._id);
      toast.success('Course deleted successfully.');
      navigate('/admin/courses');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete course.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <AdminHeader 
        onToggleSidebar={() => navigate('/admin/courses')} 
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseDetailsView 
          course={course}
          courseId={id}
          onBack={() => navigate('/admin/courses')}
          onEdit={(c) => navigate(`/admin/courses/edit/${c._id || id}`)}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
