import { useState } from 'react';

const hasErrors = (errors) => Object.values(errors).some(Boolean);
const createEmptyErrors = (values) =>
  Object.keys(values).reduce((current, key) => {
    current[key] = '';
    return current;
  }, {});

export function useValidatedForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState(() => createEmptyErrors(initialValues));
  const [touched, setTouched] = useState({});

  const runValidation = (nextValues) => {
    const nextErrors = validate(nextValues);
    setErrors(nextErrors);
    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setTouched((current) => ({
      ...current,
      [name]: true
    }));

    setValues((current) => {
      const nextValues = { ...current, [name]: value };

      if (touched[name] || value !== initialValues[name]) {
        runValidation(nextValues);
      }

      return nextValues;
    });
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
    runValidation(values);
  };

  const validateForm = () => {
    const nextErrors = runValidation(values);

    setTouched(
      Object.keys(nextErrors).reduce((current, key) => {
        current[key] = true;
        return current;
      }, {})
    );

    return !hasErrors(nextErrors);
  };

  const setFieldValue = (name, value) => {
    setValues((current) => {
      const nextValues = { ...current, [name]: value };

      if (touched[name]) {
        runValidation(nextValues);
      }

      return nextValues;
    });
  };

  const getFieldError = (name) => (touched[name] ? errors[name] : '');

  return {
    values,
    errors,
    touched,
    setValues,
    setFieldValue,
    handleChange,
    handleBlur,
    validateForm,
    getFieldError
  };
}
