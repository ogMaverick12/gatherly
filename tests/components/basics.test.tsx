import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CelebrationMark,
  Wordmark,
  GarlandLine,
  HealthRing,
  CelebrationDot,
  Tabs,
  SiteFooter,
  SiteHeader,
} from '@/features/workspace';
import { DisplaySettings } from '@/features/accessibility';
import { IntakeHeading, ChipGroup } from '@/features/intake';
import { renderWithProvider } from '../helpers';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('the wordmark', () => {
  it('shows the name and a labelled mark', () => {
    render(<Wordmark />);
    expect(screen.getByText('Gatherly')).toBeInTheDocument();
    expect(screen.getByLabelText('Gatherly mark')).toBeInTheDocument();
  });

  it('renders the mark on its own', () => {
    const { container } = render(<CelebrationMark className="h-4 w-4" />);
    expect(container.querySelector('svg')).toHaveClass('h-4');
  });
});

describe('the garland line', () => {
  it('is decorative', () => {
    const { container } = render(<GarlandLine />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('the health ring', () => {
  it('announces the score for a screen reader', () => {
    render(<HealthRing score={72} band="attention" label="Plan health" />);
    expect(screen.getByLabelText('Plan health: 72 out of 100')).toBeInTheDocument();
  });

  it('clamps a score that is out of range', () => {
    render(<HealthRing score={140} band="on_track" label="Plan health" />);
    expect(screen.getByLabelText('Plan health: 100 out of 100')).toBeInTheDocument();
  });

  it('renders a status dot', () => {
    const { container } = render(<CelebrationDot status="done" />);
    expect(container.querySelector('span')).toBeInTheDocument();
  });
});

describe('the tab strip', () => {
  const tabs = [
    { id: 'one', label: 'One' },
    { id: 'two', label: 'Two' },
    { id: 'three', label: 'Three' },
  ] as const;

  it('marks the selected tab', () => {
    render(<Tabs tabs={tabs} active="two" onChange={() => undefined} idPrefix="test" />);
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'false');
  });

  it('moves to the next tab with the arrow key', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} active="one" onChange={onChange} idPrefix="test" />);

    screen.getByRole('tab', { name: 'One' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('two');
  });

  it('wraps around at the end', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} active="three" onChange={onChange} idPrefix="test" />);

    screen.getByRole('tab', { name: 'Three' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('one');
  });

  it('jumps to the first tab with Home', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} active="two" onChange={onChange} idPrefix="test" />);

    screen.getByRole('tab', { name: 'Two' }).focus();
    await user.keyboard('{Home}');
    expect(onChange).toHaveBeenCalledWith('one');
  });

  it('calls onChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} active="one" onChange={onChange} idPrefix="test" />);

    await user.click(screen.getByRole('tab', { name: 'Three' }));
    expect(onChange).toHaveBeenCalledWith('three');
  });

  it('shows a badge when there is one', () => {
    render(
      <Tabs
        tabs={[{ id: 'one', label: 'One', badge: 3 }]}
        active="one"
        onChange={() => undefined}
        idPrefix="test"
      />,
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('the site header', () => {
  it('links to the plan and the intake', () => {
    renderWithProvider(<SiteHeader />);
    expect(screen.getByRole('link', { name: 'Your plan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tell us about the celebration' })).toBeInTheDocument();
  });

  it('changes the language', async () => {
    const user = userEvent.setup();
    renderWithProvider(<SiteHeader />);
    await user.selectOptions(screen.getByLabelText('Language'), 'hi');
    expect(screen.getByRole('link', { name: 'आपकी योजना' })).toBeInTheDocument();
  });
});

describe('the site footer', () => {
  it('says the plan stays on the device', () => {
    render(<SiteFooter />);
    expect(screen.getByText(/stays on this device/i)).toBeInTheDocument();
  });
});

describe('the display settings', () => {
  it('is closed until it is opened', async () => {
    const user = userEvent.setup();
    renderWithProvider(<DisplaySettings />);

    expect(screen.queryByRole('group', { name: 'Text size' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Display and access/i }));
    expect(screen.getByRole('group', { name: 'Text size' })).toBeInTheDocument();
  });

  it('applies the text size to the document', async () => {
    const user = userEvent.setup();
    renderWithProvider(<DisplaySettings />);
    await user.click(screen.getByRole('button', { name: /Display and access/i }));
    await user.click(screen.getByLabelText('Largest'));
    expect(document.documentElement.dataset['textSize']).toBe('xlarge');
  });

  it('applies the theme to the document', async () => {
    const user = userEvent.setup();
    renderWithProvider(<DisplaySettings />);
    await user.click(screen.getByRole('button', { name: /Display and access/i }));
    await user.click(screen.getByLabelText('Dark'));
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('turns calm mode on', async () => {
    const user = userEvent.setup();
    renderWithProvider(<DisplaySettings />);
    await user.click(screen.getByRole('button', { name: /Display and access/i }));
    await user.click(screen.getByLabelText(/Calm mode/));
    expect(document.documentElement.dataset['calm']).toBe('true');
  });

  it('turns reduced motion on', async () => {
    const user = userEvent.setup();
    renderWithProvider(<DisplaySettings />);
    await user.click(screen.getByRole('button', { name: /Display and access/i }));
    await user.click(screen.getByLabelText('Reduce motion'));
    expect(document.documentElement.dataset['motion']).toBe('off');
  });
});

describe('the intake heading', () => {
  it('uses the dictionary', () => {
    renderWithProvider(<IntakeHeading />);
    expect(
      screen.getByRole('heading', { name: 'Tell us about the celebration' }),
    ).toBeInTheDocument();
  });
});

describe('the chip group', () => {
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ] as const;

  it('adds a chip when it is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChipGroup legend="Pick" options={options} value={[]} onChange={onChange} />);
    await user.click(screen.getByLabelText('Alpha'));
    expect(onChange).toHaveBeenCalledWith(['a']);
  });

  it('removes a chip that is already on', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChipGroup legend="Pick" options={options} value={['a']} onChange={onChange} />);
    await user.click(screen.getByLabelText('Alpha'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('will not go past the limit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChipGroup legend="Pick" options={options} value={['a']} onChange={onChange} max={1} />);
    await user.click(screen.getByLabelText('Beta'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the error message', () => {
    render(
      <ChipGroup
        legend="Pick"
        options={options}
        value={[]}
        onChange={() => undefined}
        error
        errorMessage="Pick at least one"
      />,
    );
    expect(screen.getByText('Pick at least one')).toBeInTheDocument();
  });
});
