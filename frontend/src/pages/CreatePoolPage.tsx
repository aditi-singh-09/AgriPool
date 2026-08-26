import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';
import { useRegisterPool } from '../features/pools/usePools';
import { Field } from '../components/ui/Field';
import { SelectField } from '../components/ui/SelectField';
import { Button } from '../components/ui/Button';
import { getApiErrorMessage } from '../lib/api';

const participantSchema = z.object({
  role: z.enum(['farmer', 'cooperative', 'transport', 'warehouse']),
  displayName: z.string().min(1, 'Required'),
  walletAddress: z.string().regex(/^G[A-Z2-7]{55}$/, 'Must be a valid Stellar public key'),
  sharePercent: z.coerce.number().min(0.01).max(100),
});

const schema = z.object({
  poolId: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, and underscores only'),
  cooperativeName: z.string().min(2).max(120),
  participants: z
    .array(participantSchema)
    .min(1)
    .refine((list) => Math.round(list.reduce((sum, p) => sum + p.sharePercent, 0) * 100) === 10_000, {
      message: 'Shares must add up to exactly 100%',
    }),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function CreatePoolPage() {
  const navigate = useNavigate();
  const registerPool = useRegisterPool();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      participants: [
        { role: 'farmer', displayName: '', walletAddress: '', sharePercent: 60 },
        { role: 'cooperative', displayName: '', walletAddress: '', sharePercent: 20 },
        { role: 'transport', displayName: '', walletAddress: '', sharePercent: 10 },
        { role: 'warehouse', displayName: '', walletAddress: '', sharePercent: 10 },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'participants' });
  const participants = watch('participants');
  const totalPercent = participants.reduce((sum, p) => sum + (Number(p.sharePercent) || 0), 0);

  const onSubmit = async (values: FormOutput) => {
    try {
      await registerPool.mutateAsync({
        poolId: values.poolId,
        cooperativeName: values.cooperativeName,
        participants: values.participants.map((p) => ({
          role: p.role,
          displayName: p.displayName,
          walletAddress: p.walletAddress,
          shareBps: Math.round(p.sharePercent * 100),
        })),
      });
      toast.success('Pool registered off-chain — see the note below to finish on-chain setup');
      navigate('/dashboard');
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Register a settlement pool</h1>
      <p className="mt-1.5 text-sm text-graphite-600">
        Define every participant's wallet and share. Shares must total exactly 100%.
      </p>
      <div className="mt-4 rounded-lg border border-ledger-500/40 bg-ledger-500/10 p-3 text-xs text-ledger-400">
        This form registers the pool in AgriPool's directory so listings can reference it. The matching
        on-chain <code>create_pool</code> call is signed by the platform admin wallet as the final step —
        see <code>docs/DEPLOYMENT.md</code> for the exact command your cooperative's data will be submitted with.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
        <Field label="Pool ID" placeholder="pool_valley_coop" error={errors.poolId?.message} {...register('poolId')} />
        <Field label="Cooperative name" error={errors.cooperativeName?.message} {...register('cooperativeName')} />

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-graphite-700 bg-graphite-800 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-graphite-600">Participant {index + 1}</p>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-graphite-600 hover:text-stamp-500"
                    aria-label="Remove participant"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SelectField label="Role" {...register(`participants.${index}.role` as const)}>
                  <option value="farmer">Farmer</option>
                  <option value="cooperative">Cooperative</option>
                  <option value="transport">Transport</option>
                  <option value="warehouse">Warehouse</option>
                </SelectField>
                <Field
                  label="Share %"
                  type="number"
                  step="0.01"
                  error={errors.participants?.[index]?.sharePercent?.message}
                  {...register(`participants.${index}.sharePercent` as const)}
                />
                <Field
                  label="Display name"
                  error={errors.participants?.[index]?.displayName?.message}
                  {...register(`participants.${index}.displayName` as const)}
                />
                <Field
                  label="Wallet address"
                  placeholder="G..."
                  error={errors.participants?.[index]?.walletAddress?.message}
                  {...register(`participants.${index}.walletAddress` as const)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => append({ role: 'farmer', displayName: '', walletAddress: '', sharePercent: 0 })}
            className="flex items-center gap-1.5 text-sm font-medium text-marigold-400 hover:underline"
          >
            <Plus className="h-4 w-4" /> Add participant
          </button>
          <p className={totalPercent === 100 ? 'text-sm text-ledger-400' : 'text-sm text-stamp-500'}>
            Total: {totalPercent.toFixed(2)}%
          </p>
        </div>
        {errors.participants?.root?.message && (
          <p className="text-xs text-stamp-500">{errors.participants.root.message}</p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-2">
          Register pool
        </Button>
      </form>
    </div>
  );
}
