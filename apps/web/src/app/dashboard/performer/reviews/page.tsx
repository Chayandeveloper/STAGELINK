'use client';

import { ReviewsInterface } from '@/components/reviews/ReviewsInterface';

export default function PerformerReviewsPage() {
  return (
    <div className="h-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Reviews</h1>
        <p className="text-zinc-400 mt-1">See what venues and audiences are saying about your performances.</p>
      </div>
      <ReviewsInterface roleTitle="Performer" />
    </div>
  );
}
