import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReviewState {
  reviewedJobIds: string[];
  markJobReviewed: (jobId: string) => void;
  hasReviewed: (jobId: string) => boolean;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviewedJobIds: [],
      markJobReviewed: (jobId) =>
        set((s) => ({
          reviewedJobIds: s.reviewedJobIds.includes(jobId)
            ? s.reviewedJobIds
            : [...s.reviewedJobIds, jobId],
        })),
      hasReviewed: (jobId) => get().reviewedJobIds.includes(jobId),
    }),
    {
      name: 'homefix-reviewed-jobs',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
