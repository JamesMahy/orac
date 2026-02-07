import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from 'primereact/button';
import { useAuthStore } from '@stores/authStore';
import { authApi } from '@api/auth';
import { ApiError } from '@api/client';
import { FormTextInput } from '@components/TextInput';
import { FormPasswordInput } from '@components/PasswordInput';

type LoginFormData = {
  username: string;
  password: string;
};

export function Login() {
  const { t } = useTranslation('features', { keyPrefix: 'Login' });
  const authenticate = useAuthStore(state => state.authenticate);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: { username: '', password: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await authApi.login(data.username, data.password);
      authenticate();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setError('root', { message: t('invalid') });
      } else {
        setError('root', { message: t('networkError') });
      }
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-text">
          {t('title')}
        </h1>

        {errors.root?.message && (
          <div
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            role="alert"
            aria-live="assertive">
            {errors.root.message}
          </div>
        )}

        <FormTextInput
          name="username"
          control={control}
          label={t('username')}
          error={errors.username?.message}
          required
          autoComplete="username"
          autoFocus
          rules={{ required: t('usernameRequired') }}
        />

        <FormPasswordInput
          name="password"
          control={control}
          label={t('password')}
          error={errors.password?.message}
          required
          autoComplete="current-password"
          rules={{ required: t('passwordRequired') }}
        />

        <Button
          type="submit"
          label={t('submit')}
          loading={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full"
          severity="info"
        />
      </form>
    </div>
  );
}
