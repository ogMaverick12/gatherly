import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportBar, SharedPlanPrompt } from '@/features/workspace';
import { getPlan, setPlan } from '@/lib/plan-store';
import { makePlan } from '@tests/support/factories';
import { makeView, renderWithProvider } from '@tests/support/helpers';

const copyToClipboard = vi.fn();

vi.mock('@/lib/download', () => ({
  downloadFile: vi.fn(),
  copyToClipboard: (...args: unknown[]) => copyToClipboard(...args),
}));

beforeEach(() => {
  copyToClipboard.mockReset();
  setPlan(null);
  window.location.hash = '';
});

describe('the export bar when a browser action is refused', () => {
  it('reports a failed clipboard copy', async () => {
    copyToClipboard.mockResolvedValue(false);
    const user = userEvent.setup();
    renderWithProvider(<ExportBar view={makeView()} />);

    await user.click(screen.getByRole('button', { name: 'Copy a share link' }));

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('stays quiet when the file picker returns no file', () => {
    renderWithProvider(<ExportBar view={makeView()} />);
    const input = screen.getByLabelText('Restore from a file');

    fireEvent.change(input, { target: { files: [] } });

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});

describe('restoring a plan from a file', () => {
  it('stores a valid plan from the chosen file', async () => {
    const user = userEvent.setup();
    const plan = makePlan({ guests: 77 });
    renderWithProvider(<ExportBar view={makeView()} />);
    const file = new File([JSON.stringify(plan)], 'plan.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: async () => JSON.stringify(plan) });

    await user.upload(screen.getByLabelText('Restore from a file'), file);

    await waitFor(() => {
      expect(getPlan()?.intake.guests).toBe(77);
    });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});

describe('the shared plan prompt with an unusable fragment', () => {
  it('ignores a link that does not decode to a plan', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    window.location.hash = '#g1.not-a-plan';
    renderWithProvider(<SharedPlanPrompt onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: 'Open a shared plan from this link' }));

    expect(screen.queryByText(/A shared plan was found in this link/)).not.toBeInTheDocument();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
