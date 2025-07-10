'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  subject: z.string().min(1, 'Subject required'),
  message: z.string().min(10, 'Message too short'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | '';
    message: string;
  }>({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (formData: ContactFormData) => {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await api.post('/contact', formData);
      setStatus({
        type: 'success',
        message: 'Thank you for your message. We will get back to you soon!'
      });
      reset();
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to send message. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Contact Us</h1>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <div className="prose max-w-none mb-8">
            <p className="text-lg text-gray-600">
              Have a question or need assistance? We're here to help! Fill out the form
              below and we'll get back to you as soon as possible.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Email</h3>
              <p className="text-gray-600">
                <a href="mailto:support@niazitribe.com" className="text-blue-500 hover:text-blue-600">
                  support@niazitribe.com
                </a>
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Office Hours</h3>
              <p className="text-gray-600">
                Monday - Friday<br />
                9:00 AM - 5:00 PM EST
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/help" className="text-blue-500 hover:text-blue-600">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="/about" className="text-blue-500 hover:text-blue-600">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/faq" className="text-blue-500 hover:text-blue-600">
                    FAQs
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Send us a Message</h2>

            {status.message && (
              <div
                className={`p-4 mb-6 rounded-lg ${
                  status.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name')}
                  required
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  required
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  id="subject"
                  {...register('subject')}
                  required
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing Question</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
                {errors.subject && <p className="text-sm text-red-600 mt-1">{errors.subject.message}</p>}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  {...register('message')}
                  required
                  rows={5}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.message && <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 