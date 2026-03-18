import { useState } from 'react'
import { type ZodSchema } from 'zod'

type FormState<T> = {
  values: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
}

export function useForm<T extends Record<string, unknown>>(
  schema: ZodSchema<T>,
  initialValues: T
) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    isSubmitting: false,
  })

  const setValue = (field: keyof T, value: unknown) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [field]: value },
      errors: { ...prev.errors, [field]: undefined },
    }))
  }

  const validate = (): T | null => {
    const result = schema.safeParse(state.values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof T, string>> = {}
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof T
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      })
      setState(prev => ({ ...prev, errors: fieldErrors }))
      return null
    }
    return result.data
  }

  const setSubmitting = (val: boolean) =>
    setState(prev => ({ ...prev, isSubmitting: val }))

  const reset = () =>
    setState({ values: initialValues, errors: {}, isSubmitting: false })

  return { ...state, setValue, validate, setSubmitting, reset }
}