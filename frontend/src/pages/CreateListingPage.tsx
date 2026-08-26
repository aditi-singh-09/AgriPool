import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCreateListing } from '../features/listings/useListings';
import { Field } from '../components/ui/Field';
import { SelectField } from '../components/ui/SelectField';
import { TextAreaField } from '../components/ui/TextAreaField';
import { Button } from '../components/ui/Button';
import { getApiErrorMessage } from '../lib/api';

const schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(2000),
  produceType: z.string().min(2).max(60),
  unit: z.enum(['kg', 'quintal', 'tonne', 'crate', 'bag']),
  pricePerUnit: z.coerce.number().positive(),
  quantityAvailable: z.coerce.number().positive(),
  poolId: z.string().min(3),
  region: z.string().max(80).optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function CreateListingPage() {
  const navigate = useNavigate();
  const createListing = useCreateListing();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { unit: 'kg' },
  });

  const onSubmit = async (values: FormOutput) => {
    try {
      const listing = await createListing.mutateAsync(values);
      toast.success('Listing published');
      navigate(`/marketplace/${listing._id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">List produce for sale</h1>
      <p className="mt-1.5 text-sm text-graphite-600">
        Every listing settles through a registered pool — pick the cooperative pool this sale belongs to.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4" noValidate>
        <Field label="Title" error={errors.title?.message} {...register('title')} />
        <TextAreaField label="Description" error={errors.description?.message} {...register('description')} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Produce type" placeholder="e.g. Tomatoes" error={errors.produceType?.message} {...register('produceType')} />
          <SelectField label="Unit" error={errors.unit?.message} {...register('unit')}>
            <option value="kg">kg</option>
            <option value="quintal">quintal</option>
            <option value="tonne">tonne</option>
            <option value="crate">crate</option>
            <option value="bag">bag</option>
          </SelectField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Price per unit (XLM)"
            type="number"
            step="0.01"
            error={errors.pricePerUnit?.message}
            {...register('pricePerUnit')}
          />
          <Field
            label="Quantity available"
            type="number"
            error={errors.quantityAvailable?.message}
            {...register('quantityAvailable')}
          />
        </div>
        <Field label="Settlement pool ID" placeholder="e.g. POOL123" error={errors.poolId?.message} {...register('poolId')} />
        <Field label="Region (optional)" error={errors.region?.message} {...register('region')} />
        <Button type="submit" isLoading={isSubmitting} className="mt-2">
          Publish listing
        </Button>
      </form>
    </div>
  );
}
