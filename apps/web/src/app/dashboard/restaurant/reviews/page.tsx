'use client';

import { ReviewsInterface } from '@/components/reviews/ReviewsInterface';

export default function RestaurantReviewsPage() {
  return (
    <div className="h-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Reviews</h1>
        <p className="text-zinc-400 mt-1">See what performers and audiences are saying about your venue.</p>
      </div>
      <ReviewsInterface roleTitle="Venue" />
    </div>
  );
}
