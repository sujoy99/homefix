import { act } from '@testing-library/react-native';
import { useReviewStore } from '../../store/reviewStore';

// AsyncStorage is auto-mocked via jest.config.js moduleNameMapper

describe('reviewStore', () => {
  beforeEach(() => {
    act(() => {
      useReviewStore.setState({ reviewedJobIds: [] });
    });
  });

  it('hasReviewed returns false for an unknown job', () => {
    expect(useReviewStore.getState().hasReviewed('job-1')).toBe(false);
  });

  it('markJobReviewed adds the job id and hasReviewed returns true', () => {
    act(() => {
      useReviewStore.getState().markJobReviewed('job-1');
    });

    expect(useReviewStore.getState().hasReviewed('job-1')).toBe(true);
  });

  it('does not affect other job ids when one is marked', () => {
    act(() => {
      useReviewStore.getState().markJobReviewed('job-1');
    });

    expect(useReviewStore.getState().hasReviewed('job-2')).toBe(false);
  });

  it('markJobReviewed is idempotent — no duplicate ids stored', () => {
    act(() => {
      useReviewStore.getState().markJobReviewed('job-1');
      useReviewStore.getState().markJobReviewed('job-1');
    });

    const { reviewedJobIds } = useReviewStore.getState();
    expect(reviewedJobIds.filter((id) => id === 'job-1')).toHaveLength(1);
  });

  it('tracks multiple distinct jobs independently', () => {
    act(() => {
      useReviewStore.getState().markJobReviewed('job-1');
      useReviewStore.getState().markJobReviewed('job-2');
    });

    expect(useReviewStore.getState().hasReviewed('job-1')).toBe(true);
    expect(useReviewStore.getState().hasReviewed('job-2')).toBe(true);
    expect(useReviewStore.getState().reviewedJobIds).toHaveLength(2);
  });
});
