import { useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
} from '@mui/material'
import { useForm, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ZodType } from 'zod'

export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea'
  required?: boolean
  multiline?: boolean
  rows?: number
}

export interface EntityFormDialogProps<T extends FieldValues> {
  open: boolean
  title: string
  mode: 'create' | 'edit'
  initialValues?: Partial<T>
  schema: ZodType<T>
  fields: FormField[]
  onSubmit: (data: T) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function EntityFormDialog<T extends FieldValues>({
  open,
  title,
  mode,
  initialValues,
  schema,
  fields,
  onSubmit,
  onCancel,
  isLoading = false,
}: EntityFormDialogProps<T>) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<T>({
    resolver: zodResolver(schema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: initialValues as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  })

  useEffect(() => {
    if (open) {
      reset(initialValues as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }, [open, initialValues, reset])

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit as any)}> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {fields.map((field) => (
              <TextField
                key={field.name}
                {...register(field.name as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                label={field.label}
                type={field.type === 'textarea' ? 'text' : field.type}
                multiline={field.multiline}
                rows={field.rows}
                required={field.required}
                error={!!errors[field.name as keyof T]}
                helperText={errors[field.name as keyof T]?.message as string}
                fullWidth
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
