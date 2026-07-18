import { Link } from 'react-router-dom';
import { Card, EmptyState } from '../components/ui';

export default function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        title="Page not found"
        hint="The page you're looking for doesn't exist or has moved."
        action={
          <Link to="/" className="micro text-sm text-accent hover:underline">
            Back to dashboard
          </Link>
        }
      />
    </Card>
  );
}
