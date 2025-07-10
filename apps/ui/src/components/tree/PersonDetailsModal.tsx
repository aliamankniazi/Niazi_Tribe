'use client';
import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface PersonDetailsModalProps {
  personId: string | 'new';
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Simple trigger to refetch data
}

interface PersonForm {
  first_name: string;
  last_name: string;
  birth_date?: string;
  death_date?: string;
  gender: 'male' | 'female' | 'other';
}

export function PersonDetailsModal({ personId, isOpen, onClose, onSave }: PersonDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<PersonForm>();

  useEffect(() => {
    const loadPersonData = async () => {
      if (personId === 'new' || !personId) {
        reset({
          first_name: '',
          last_name: '',
          gender: 'other',
        });
        return;
      }

      setIsLoading(true);
      try {
        const { data } = await api.get(`/persons/${personId}`);
        const person = data.data;
        reset({
          first_name: person.first_name || '',
          last_name: person.last_name || '',
          gender: person.gender || 'other',
          birth_date: person.birth_date ? person.birth_date.split('T')[0] : '',
          death_date: person.death_date ? person.death_date.split('T')[0] : '',
        });
      } catch (error) {
        toast.error('Failed to load person data');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadPersonData();
    }
  }, [isOpen, personId, reset, onClose]);

  const onSubmit = async (formData: PersonForm) => {
    setIsLoading(true);
    try {
      if (personId === 'new') {
        await api.post('/persons', formData);
        toast.success('Person added successfully');
      } else {
        await api.put(`/persons/${personId}`, formData);
        toast.success('Person updated successfully');
      }
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save person');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {personId === 'new' ? 'Add New Person' : 'Edit Person'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="first_name" className="form-label">First Name *</label>
                <input
                  {...register('first_name', { required: 'First name is required' })}
                  type="text"
                  id="first_name"
                  className={`form-input ${errors.first_name ? 'border-red-500' : ''}`}
                  placeholder="Enter first name"
                />
                {errors.first_name && <p className="form-error">{errors.first_name.message}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="last_name" className="form-label">Last Name *</label>
                <input
                  {...register('last_name', { required: 'Last name is required' })}
                  type="text"
                  id="last_name"
                  className={`form-input ${errors.last_name ? 'border-red-500' : ''}`}
                  placeholder="Enter last name"
                />
                {errors.last_name && <p className="form-error">{errors.last_name.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="birth_date" className="form-label">Birth Date</label>
                <input {...register('birth_date')} type="date" id="birth_date" className="form-input" />
              </div>
              <div className="form-group">
                <label htmlFor="death_date" className="form-label">Death Date</label>
                <input {...register('death_date')} type="date" id="death_date" className="form-input" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="gender" className="form-label">Gender *</label>
              <select
                {...register('gender', { required: 'Gender is required' })}
                id="gender"
                className={`form-input ${errors.gender ? 'border-red-500' : ''}`}
              >
                <option value="other">Other</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && <p className="form-error">{errors.gender.message}</p>}
            </div>
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button type="button" onClick={onClose} className="btn btn-outline mr-2">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn btn-primary">
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 