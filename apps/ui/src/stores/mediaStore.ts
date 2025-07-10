import { create } from 'zustand';
import axios from 'axios';
import { Media } from '@/types/media';

interface MediaState {
  media: Media[];
  isLoading: boolean;
  uploadProgress: { [key: string]: number };
  
  // Actions
  fetchMedia: (personId?: string, limit?: number) => Promise<void>;
  uploadMedia: (formData: FormData, onProgress?: (progress: number) => void) => Promise<Media>;
  updateMedia: (mediaId: string, updates: Partial<Media>) => Promise<Media>;
  deleteMedia: (mediaId: string) => Promise<void>;
  getMediaById: (mediaId: string) => Promise<Media>;
  searchMedia: (query: string, filters?: any) => Promise<void>;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  media: [],
  isLoading: false,
  uploadProgress: {},

  fetchMedia: async (personId?: string, limit = 50) => {
    set({ isLoading: true });
    try {
      const params: any = { limit };
      if (personId) {
        params.personId = personId;
      }

      const response = await axios.get('/api/media', { params });
      
      set({
        media: response.data.data,
        isLoading: false
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Failed to fetch media');
    }
  },

  uploadMedia: async (formData: FormData, onProgress?: (progress: number) => void) => {
    const uploadId = Date.now().toString();
    
    try {
      set((state) => ({
        uploadProgress: { ...state.uploadProgress, [uploadId]: 0 }
      }));

      const response = await axios.post('/api/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            
            set((state) => ({
              uploadProgress: { ...state.uploadProgress, [uploadId]: progress }
            }));
            
            if (onProgress) {
              onProgress(progress);
            }
          }
        },
      });

      const newMedia = response.data.data;
      
      set((state) => ({
        media: [newMedia, ...state.media],
        uploadProgress: { ...state.uploadProgress, [uploadId]: 100 }
      }));

      // Clean up progress after a delay
      setTimeout(() => {
        set((state) => {
          const newProgress = { ...state.uploadProgress };
          delete newProgress[uploadId];
          return { uploadProgress: newProgress };
        });
      }, 2000);

      return newMedia;
    } catch (error: any) {
      set((state) => {
        const newProgress = { ...state.uploadProgress };
        delete newProgress[uploadId];
        return { uploadProgress: newProgress };
      });
      
      throw new Error(error.response?.data?.message || 'Upload failed');
    }
  },

  updateMedia: async (mediaId: string, updates: Partial<Media>) => {
    set({ isLoading: true });
    try {
      const response = await axios.put(`/api/media/${mediaId}`, updates);
      const updatedMedia = response.data.data;
      
      set((state) => ({
        media: state.media.map((item) =>
          item.id === mediaId ? updatedMedia : item
        ),
        isLoading: false
      }));
      
      return updatedMedia;
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Failed to update media');
    }
  },

  deleteMedia: async (mediaId: string) => {
    set({ isLoading: true });
    try {
      await axios.delete(`/api/media/${mediaId}`);
      
      set((state) => ({
        media: state.media.filter((item) => item.id !== mediaId),
        isLoading: false
      }));
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Failed to delete media');
    }
  },

  getMediaById: async (mediaId: string) => {
    try {
      const response = await axios.get(`/api/media/${mediaId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch media');
    }
  },

  searchMedia: async (query: string, filters?: any) => {
    set({ isLoading: true });
    try {
      const params = { query, ...filters };
      const response = await axios.get('/api/media/search', { params });
      
      set({
        media: response.data.data,
        isLoading: false
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Search failed');
    }
  }
})); 