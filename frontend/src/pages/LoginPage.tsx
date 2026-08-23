import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../features/auth/AuthContext';
import { Field } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { getApiErrorMessage } from '../lib/api';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password);
      toast.success('Welcome back');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
      <h1 className="font-display text-2xl font-semibold">Log in to AgriPool</h1>
      <p className="mt-1.5 text-sm text-graphite-600">Access your marketplace, dashboard, and wallet history.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4" noValidate>
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" isLoading={isSubmitting} className="mt-2">
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-graphite-600">
        New to AgriPool?{' '}
        <Link to="/register" className="font-medium text-marigold-400 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
