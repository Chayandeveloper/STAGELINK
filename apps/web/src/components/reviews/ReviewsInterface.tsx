'use client';

import { Star, MessageSquare } from 'lucide-react';

export function ReviewsInterface({ roleTitle }: { roleTitle: string }) {
  const reviews = [
    { id: 1, author: 'Alex Johnson', rating: 5, date: 'Oct 12, 2026', text: 'Incredible experience! The energy was unmatched.' },
    { id: 2, author: 'Sarah Smith', rating: 4, date: 'Oct 05, 2026', text: 'Great vibe, though the acoustic setup could have been a bit louder.' },
    { id: 3, author: 'Mike Davis', rating: 5, date: 'Sep 28, 2026', text: 'Absolutely loved it. Will definitely book again.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center border-4 border-yellow-500/20 text-yellow-400">
            <span className="text-2xl font-bold">4.8</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Overall Rating</h2>
            <div className="flex items-center mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={16} className={star <= 4 ? "text-yellow-400 fill-yellow-400" : "text-zinc-600"} />
              ))}
              <span className="text-sm text-zinc-400 ml-2">(24 reviews)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white flex items-center">
            <MessageSquare size={18} className="mr-2 text-zinc-500" /> Recent Reviews
          </h2>
        </div>
        <div className="divide-y divide-zinc-800">
          {reviews.map((review) => (
            <div key={review.id} className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-white font-medium">{review.author}</h4>
                  <p className="text-xs text-zinc-500">{review.date}</p>
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} className={star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-600"} />
                  ))}
                </div>
              </div>
              <p className="text-zinc-300 text-sm bg-zinc-800/30 p-4 rounded-lg italic">
                "{review.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
