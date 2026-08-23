import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../features/auth/AuthContext';
import { Field } from '../components/ui/Field';
import { SelectField } from '../components/ui/SelectField';
import { Button } from '../components/ui/Button';
import { getApiErrorMessage } from '../lib/api';

const schema = z.object({
  displayName: z.string().min(2, 'Enter your name').max(80),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'At least 8 characters'),
  role: z.enum(['buyer', 'farmer', 'cooperative', 'transport', 'warehouse']),
  walletAddress: z
    .string()
    .regex(/^G[A-Z2-7]{55}$/, 'Must be a valid Stellar public key (starts with G)')
    .optional()
    .or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: 'buyer' } });

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser({
        ...values,
        walletAddress: values.walletAddress || undefined,
      });
      toast.success('Account created');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">Create your account</h1>
      <p className="mt-1.5 text-sm text-graphite-600">
        Choose the role that matches how you'll use AgriPool — this decides what you can do on the platform.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4" noValidate>
        <Field label="Full name" error={errors.displayName?.message} {...register('displayName')} />
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <SelectField label="I am a…" error={errors.role?.message} {...register('role')}>
          <option value="buyer">Buyer</option>
          <option value="farmer">Farmer</option>
          <option value="cooperative">Cooperative manager</option>
          <option value="transport">Transport provider</option>
          <option value="warehouse">Warehouse operator</option>
        </SelectField>
        <Field
          label="Stellar wallet address (optional)"
          placeholder="G..."
          hint="You can connect Freighter and add this later instead."
          error={errors.walletAddress?.message}
          {...register('walletAddress')}
        />
        <Button type="submit" isLoading={isSubmitting} className="mt-2">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-graphite-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-marigold-400 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
