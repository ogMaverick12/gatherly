import { Component, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ErrorPage from '@/app/error';
import GlobalError from '@/app/global-error';

let broken = true;

/** A stand-in panel that keeps failing until the fallback clears it. */
function ThrowingPanel() {
  if (broken) {
    throw new Error('The panel could not render.');
  }
  return <p>Panel recovered.</p>;
}

/** The same class boundary Next.js places around a route segment. */
class PanelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    if (this.state.failed) {
      return (
        <ErrorPage
          error={new Error('The panel could not render.')}
          reset={() => {
            broken = false;
            this.setState({ failed: false });
          }}
        />
      );
    }
    return this.props.children;
  }
}

describe('the error boundary', () => {
  it('announces the failure, focuses the heading and recovers on Try again', async () => {
    const user = userEvent.setup();

    render(
      <PanelBoundary>
        <ThrowingPanel />
      </PanelBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: 'That part of the plan hit a snag.' });
    expect(heading).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Panel recovered.')).toBeInTheDocument();
  });

  it('renders the global fallback as its own document', () => {
    render(<GlobalError error={new Error('layout failed')} reset={() => undefined} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gatherly could not load.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
