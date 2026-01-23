import { useForm, Controller } from 'react-hook-form';
import type { SubmitHandler, FieldValues, DefaultValues, Path } from 'react-hook-form';
import Button from './Button';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string | number; label: string }>;
}

interface GenericFormProps<T extends FieldValues> {
  fields: FormField[];
  onSubmit: SubmitHandler<T>;
  onCancel: () => void;
  initialValues?: DefaultValues<T>;
}

const GenericForm = <T extends FieldValues>({
  fields,
  onSubmit,
  onCancel,
  initialValues,
}: GenericFormProps<T>) => {
  const { control, handleSubmit, register } = useForm<T>({
    defaultValues: initialValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col">
          <label className="mb-2 font-semibold text-pwc-black">
            {field.label}
            {field.required && <span className="text-red-600"> *</span>}
          </label>

          {field.type === 'select' && (
            <Controller
              name={field.name as Path<T>} 
              control={control}
              rules={{ required: field.required }}
              render={({ field: fieldProps }) => (
                <select
                  {...fieldProps}
                  className="px-4 py-2 border border-gray-300 rounded-none focus:border-pwc-orange focus:outline-none focus:ring-2 focus:ring-pwc-orange"
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            />
          )}

          {field.type === 'textarea' && (
            <textarea
              {...register(field.name as Path<T>, { required: field.required })}
              placeholder={field.placeholder}
              className="px-4 py-2 border border-gray-300 rounded-none focus:border-pwc-orange focus:outline-none focus:ring-2 focus:ring-pwc-orange resize-none"
              rows={4}
            />
          )}

          {['text', 'number', 'email'].includes(field.type) && (
            <input
              {...register(field.name as Path<T>, { required: field.required })}
              type={field.type}
              placeholder={field.placeholder}
              className="px-4 py-2 border border-gray-300 rounded-none focus:border-pwc-orange focus:outline-none focus:ring-2 focus:ring-pwc-orange"
            />
          )}
        </div>
      ))}

      {/* Form Actions */}
      <div className="flex gap-4 justify-end pt-6 border-t border-gray-300">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save
        </Button>
      </div>
    </form>
  );
};

export default GenericForm;