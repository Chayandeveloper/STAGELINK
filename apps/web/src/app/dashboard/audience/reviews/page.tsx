'use client';

import { ReviewsInterface } from '@/components/reviews/ReviewsInterface';

export default function AudienceReviewsPage() {
  return (
    <div className="h-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">My Reviews</h1>
        <p className="text-zinc-400 mt-1">Manage the reviews you've left for events and performers.</p>
      </div>
      <ReviewsInterface roleTitle="Audience" />
    </div>
  );
}
