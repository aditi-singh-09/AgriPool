import { useState } from 'react';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';
import { getApiErrorMessage } from '../../lib/api';

export function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const submit = useMutation({
    mutationFn: async () => {
      await api.post('/feedback', { rating, comment: comment || undefined, category: 'payment_experience' });
    },
    onSuccess: () => {
      toast.success('Thanks — feedback recorded');
      setRating(0);
      setComment('');
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <form
      className="mt-4 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (rating === 0) {
          toast.error('Choose a star rating first');
          return;
        }
        submit.mutate();
      }}
    >
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            onClick={() => setRating(value)}
            className="p-1"
          >
            <Star
              className={cn('h-6 w-6', value <= rating ? 'fill-marigold-500 text-marigold-500' : 'text-graphite-600')}
              aria-hidden
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Anything we should know? (optional)"
        className="min-h-20 rounded-lg border border-graphite-600 bg-graphite-900 px-3.5 py-2.5 text-sm outline-none focus:border-marigold-500"
      />
      <Button type="submit" size="sm" className="self-start" isLoading={submit.isPending}>
        Send feedback
      </Button>
    </form>
  );
}
