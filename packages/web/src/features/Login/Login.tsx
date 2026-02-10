import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from 'primereact/button';
import { useAuthStore } from '@stores/authStore';
import { authApi } from '@api/auth';
import { FormError } from '@components/FormError';
import { FormTextInput } from '@components/TextInput';
import { FormPasswordInput } from '@components/PasswordInput';
import { extractErrorCode, translateError } from '@utils/translateError';

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
      const code = extractErrorCode(error);
      const message = translateError(code, t) ?? t('Unable to connect to server');
      setError('root', { message });
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-surface">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-text">
          {t('ORAC')}
        </h1>

        <FormError message={errors.root?.message} />

        <FormTextInput
          name="username"
          control={control}
          label={t('Username')}
          error={errors.username?.message}
          required
          autoComplete="username"
          autoFocus
          rules={{ required: t('Please enter your username') }}
        />

        <FormPasswordInput
          name="password"
          control={control}
          label={t('Password')}
          error={errors.password?.message}
          required
          autoComplete="current-password"
          rules={{ required: t('Please enter your password') }}
        />

        <Button
          type="submit"
          label={t('Sign In')}
          loading={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full"
          severity="info"
        />
      </form>
    </div>
  );
}
