import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DisplaySettings,
  AccessibilityProvider,
  DEFAULT_PREFERENCES,
  useAccessibility,
} from '@/features/accessibility';
import { renderWithProvider } from '../helpers';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function Probe() {
  const { preferences, setCalmMode, setTextSize, setTheme, speechSupported, speak, stopSpeaking } =
    useAccessibility();
  return (
    <div>
      <p data-testid="text-size">{preferences.textSize}</p>
      <p data-testid="calm">{String(preferences.calmMode)}</p>
      <p data-testid="speech">{String(speechSupported)}</p>
      <button type="button" onClick={() => setTextSize('xlarge')}>
        make it large
      </button>
      <button type="button" onClick={() => setCalmMode(true)}>
        make it calm
      </button>
      <button type="button" onClick={() => setTheme('dark')}>
        make it dark
      </button>
      <button type="button" onClick={() => speak('Hello there.')}>
        read it
      </button>
      <button type="button" onClick={stopSpeaking}>
        stop it
      </button>
    </div>
  );
}

describe('the display settings', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-text-size');
    document.documentElement.removeAttribute('data-calm');
  });

  it('opens and closes', async () => {
    const user = userEvent.setup();
    renderWithProvider(<DisplaySettings />);

    const toggle = screen.getByRole('button', { name: /Display and access/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('changes the text size and applies it to the document', async () => {
    const user = userEvent.setup();
    renderWithProvider(<DisplaySettings />);

    await user.click(screen.getByRole('button', { name: /Display and access/i }));
    await user.click(screen.getByRole('radio', { name: 'Large' }));

    await waitFor(() => {
      expect(document.documentElement.dataset['textSize']).toBe('large');
    });
  });

  it('remembers the text size on the device', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProvider(<DisplaySettings />);

    await user.click(screen.getByRole('button', { name: /Display and access/i }));
    await user.click(screen.getByRole('radio', { name: 'Largest' }));

    await waitFor(() => {
      expect(window.localStorage.getItem('gatherly:prefs:v1')).toContain('xlarge');
    });

    unmount();

    // A fresh provider reads the stored value back.
    renderWithProvider(<Probe />);
    expect(await screen.findByTestId('text-size')).toHaveTextContent('xlarge');
  });

  it('turns Calm mode on and remembers it', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProvider(<DisplaySettings />);

    await user.click(screen.getByRole('button', { name: /Display and access/i }));
    await user.click(screen.getByRole('checkbox', { name: /Calm mode/i }));

    await waitFor(() => {
      expect(document.documentElement.dataset['calm']).toBe('true');
    });

    unmount();
    renderWithProvider(<Probe />);
    expect(await screen.findByTestId('calm')).toHaveTextContent('true');
  });

  it('turns reduced motion on', async () => {
    const user = userEvent.setup();
    renderWithProvider(<DisplaySettings />);

    await user.click(screen.getByRole('button', { name: /Display and access/i }));
    await user.click(screen.getByRole('checkbox', { name: /Reduce motion/i }));

    await waitFor(() => {
      expect(document.documentElement.dataset['motion']).toBe('off');
    });
  });

  it('says when speech is not available', async () => {
    const user = userEvent.setup();
    renderWithProvider(<DisplaySettings />);

    await user.click(screen.getByRole('button', { name: /Display and access/i }));

    expect(screen.getByText('This browser cannot read text aloud.')).toBeInTheDocument();
  });

  it('offers to read aloud when the browser can speak', async () => {
    const user = userEvent.setup();
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn() });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        lang = '';
        rate = 1;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(public text: string) {}
      },
    );

    try {
      renderWithProvider(<DisplaySettings />);
      await user.click(screen.getByRole('button', { name: /Display and access/i }));
      await user.click(screen.getByRole('button', { name: /Read aloud/i }));

      expect(speak).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('the accessibility provider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Every test gets a predictable media query result.
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });

  it('starts from the defaults', () => {
    renderWithProvider(<Probe />);
    expect(screen.getByTestId('text-size')).toHaveTextContent(DEFAULT_PREFERENCES.textSize);
    expect(screen.getByTestId('calm')).toHaveTextContent('false');
  });

  it('ignores a stored value that does not match the schema', () => {
    window.localStorage.setItem('gatherly:prefs:v1', '{"calmMode":"yes"}');
    renderWithProvider(<Probe />);
    expect(screen.getByTestId('text-size')).toHaveTextContent('standard');
  });

  it('survives stored data that is not JSON', () => {
    window.localStorage.setItem('gatherly:prefs:v1', 'not json');
    renderWithProvider(<Probe />);
    expect(screen.getByTestId('text-size')).toHaveTextContent('standard');
  });

  it('sets the document language', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Probe />);

    await user.click(screen.getByRole('button', { name: 'make it large' }));

    await waitFor(() => {
      expect(document.documentElement.dataset['textSize']).toBe('xlarge');
    });
    expect(document.documentElement.lang).toBe('en');
  });

  it('applies an initial language', async () => {
    // Rendered without the helper's wrapper, so this provider is the only
    // one writing to the document element.
    render(
      <AccessibilityProvider initialLanguage="hi">
        <Probe />
      </AccessibilityProvider>,
    );
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('hi');
    });
  });

  it('applies the dark theme', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Probe />);

    await user.click(screen.getByRole('button', { name: 'make it dark' }));

    await waitFor(() => {
      expect(document.documentElement.dataset['theme']).toBe('dark');
    });
  });

  it('follows the system colour scheme', async () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: matchMedia });
    renderWithProvider(<Probe />);

    await waitFor(() => {
      expect(document.documentElement.dataset['theme']).toBe('dark');
    });
    expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });

  it('says that speech is not supported when the browser cannot speak', () => {
    renderWithProvider(<Probe />);
    expect(screen.getByTestId('speech')).toHaveTextContent('false');
  });

  it('stops speaking when the user asks it to', async () => {
    const user = userEvent.setup();
    const cancel = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        lang = '';
        rate = 1;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor(public text: string) {}
      },
    );

    try {
      renderWithProvider(<Probe />);
      await user.click(screen.getByRole('button', { name: 'read it' }));
      await user.click(screen.getByRole('button', { name: 'stop it' }));
      expect(cancel).toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
