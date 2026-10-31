import { useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { MoneyStep } from '@/features/intake/components/steps/MoneyStep';
import { DEFAULT_INTAKE_VALUES, type IntakeFormValues } from '@/features/intake/schema';
import { renderWithProvider } from '@tests/support/helpers';

/** A money step whose budget field fails validation once mounted. */
function MoneyStepWithBudgetError() {
  const form = useForm<IntakeFormValues>({
    defaultValues: { ...DEFAULT_INTAKE_VALUES, budget: -1 },
  });

  useEffect(() => {
    form.setError('budget', {
      type: 'min',
      message: 'Enter a budget of zero or more.',
    });
  }, [form]);

  return <MoneyStep form={form} currency="INR" guests={0} perGuest={0} />;
}

describe('the money step', () => {
  it('announces a budget error and explains the per-guest gap when guests are unknown', async () => {
    renderWithProvider(<MoneyStepWithBudgetError />);

    expect(await screen.findByText('Enter a budget of zero or more.')).toBeInTheDocument();
    expect(screen.getByLabelText('Total budget')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('An estimate is fine to begin with.')).toBeInTheDocument();
    expect(screen.queryByText(/per guest, before the 8% contingency/)).not.toBeInTheDocument();
  });
});
