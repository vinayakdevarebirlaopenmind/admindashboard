import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../utils/api_url';

interface Coupon {
  code: string;
  description?: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number | string;
  start_date: string;
  end_date: string;
  uses_per_coupon?: number | string;
  applicable_courses: string[];
  created_by: number;
  is_active: boolean;
}

interface Course {
  id: string;
  title: string;
}

const CouponAdminPanel = () => {
  const [coupon, setCoupon] = useState<Coupon>({
    code: '',
    description: '',
    discount_type: 'fixed',
    discount_value: '',
    start_date: '',
    end_date: '',
    uses_per_coupon: '',
    applicable_courses: [],
    created_by: 1,
    is_active: true,
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    loadCourses();
    loadCoupons();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/getAllCourses`);
      setCourses(res.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      alert('Failed to load courses');
    }
  };

  const loadCoupons = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/coupons/getCoupons`);
      setAllCoupons(res.data);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      // alert('Failed to load coupons');
    }
  };

  const handleFormChange = (field: keyof Coupon, value: any) => {
    setCoupon(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (
    e: React.ChangeEvent<HTMLSelectElement>,
    field: 'applicable_courses'
  ) => {
    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
    setCoupon(prev => ({ ...prev, [field]: selected }));
  };

  const handleSubmit = async () => {

    try {
      const payload = {
        ...coupon,
        applicable_courses: JSON.stringify(coupon.applicable_courses),
      };
      await axios.post(`${API_URL}/api/coupons/createCoupon`, payload);
      alert('Coupon created successfully');
      resetForm();
      loadCoupons();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create coupon');
    }
  };

  const handleToggleStatus = async (code: string, currentStatus: boolean) => {
    try {
      await axios.patch(`${API_URL}/api/coupons/toggleStatus/${code}`, {
        is_active: !currentStatus,
      });
      loadCoupons(); // Refresh list after update
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status');
    }
  };

  const resetForm = () => {
    setCoupon({
      code: '',
      description: '',
      discount_type: 'fixed',
      discount_value: '',
      start_date: '',
      end_date: '',
      uses_per_coupon: '',
      applicable_courses: [],
      created_by: 1,
      is_active: true,
    });
  };

  return (
    <div className="p-6 bg-white dark:text-white dark:bg-gray-800 shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Create New Coupon</h2>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-1 font-medium">Coupon Code *</label>
          <input name="code" value={coupon.code} onChange={e => handleFormChange('code', e.target.value)} required className="p-2 border rounded w-full" />
        </div>

        <div>
          <label className="block mb-1 font-medium">Discount Type *</label>
          <select name="discount_type" value={coupon.discount_type} onChange={e => handleFormChange('discount_type', e.target.value)} required className="p-2 border rounded w-full">
            <option value="fixed">Fixed Amount</option>
            <option value="percentage">Percentage based</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Discount Value *</label>
          <input name="discount_value" type="number" value={coupon.discount_value} onChange={e => handleFormChange('discount_value', e.target.value)} required className="p-2 border rounded w-full" />
        </div>

        <div>
          <label className="block mb-1 font-medium">Start Date *</label>
          <input name="start_date" type="datetime-local" value={coupon.start_date} onChange={e => handleFormChange('start_date', e.target.value)} required className="p-2 border rounded w-full" />
        </div>

        <div>
          <label className="block mb-1 font-medium">End Date *</label>
          <input name="end_date" type="datetime-local" value={coupon.end_date} onChange={e => handleFormChange('end_date', e.target.value)} required className="p-2 border rounded w-full" />
        </div>

        <div>
          <label className="block mb-1 font-medium">Usage Limit Of Coupon</label>
          <input name="uses_per_coupon" type="number" value={coupon.uses_per_coupon} onChange={e => handleFormChange('uses_per_coupon', e.target.value)} className="p-2 border rounded w-full" />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-1 font-medium">Description *</label>
          <textarea name="description" value={coupon.description} onChange={e => handleFormChange('description', e.target.value)} required className="p-2 border rounded w-full" rows={2} />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-1 font-medium">Applicable Courses *</label>
          <select multiple value={coupon.applicable_courses} onChange={(e) => handleMultiSelect(e, 'applicable_courses')} required className="h-40 p-2 border rounded w-full">
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <input type="checkbox" name="is_active" checked={coupon.is_active} onChange={e => handleFormChange('is_active', e.target.checked)} className="mr-2" />
          <label className="font-medium">Active</label>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 md:col-span-2"
        >
          Create Coupon
        </button>
      </form>

      <div className="mt-12">
        <div className="p-6 bg-white dark:bg-gray-800 shadow rounded-lg">
          <h2 className="text-2xl font-bold mb-6">Coupons Management</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-25">
                <tr>
                  <th className="border px-3 py-2">Code</th>
                  <th className="border px-3 py-2">Description</th>
                  <th className="border px-3 py-2">Type</th>
                  <th className="border px-3 py-2">Courses</th>
                  <th className="border px-3 py-2">Value</th>
                  <th className="border px-3 py-2">Start</th>
                  <th className="border px-3 py-2">End</th>
                  <th className="border px-3 py-2">Uses</th>
                  <th className="border px-3 py-2">Status</th>
                  <th className="border px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {allCoupons.map((c) => {
                  const courseIds = Array.isArray(c.applicable_courses)
                    ? c.applicable_courses
                    : JSON.parse(c.applicable_courses as unknown as string);
                  const courseTitles = courseIds.map((id: string) => {
                    const match = courses.find(course => String(course.id) === id);
                    return match ? match.title : `Course ID ${id}`;
                  }).join(', ');

                  return (
                    <tr key={c.code} className="border-t">
                      <td className="border px-3 py-2">{c.code}</td>
                      <td className="border px-3 py-2">{c.description}</td>
                      <td className="border px-3 py-2 capitalize">{c.discount_type}</td>
                      <td className="border px-3 py-2">{courseTitles}</td>
                      <td className="border px-3 py-2">₹{c.discount_value}</td>
                      <td className="border px-3 py-2">{new Date(c.start_date).toLocaleString()}</td>
                      <td className="border px-3 py-2">{new Date(c.end_date).toLocaleString()}</td>
                      <td className="border px-3 py-2">{c.uses_per_coupon || '-'}</td>
                      <td className="border px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="border px-3 py-2">
                        <button
                          onClick={() => handleToggleStatus(c.code, c.is_active)}
                          className={`text-white px-2 py-1 rounded text-xs ${c.is_active ? 'bg-red-600' : 'bg-green-600'}`}
                        >
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div >
  );
};

export default CouponAdminPanel;
