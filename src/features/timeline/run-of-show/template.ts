/** The fields one run-of-show step is written with. */
export interface RunOfShowTemplate {
  readonly id: string;
  readonly start: string;
  readonly durationMinutes: number;
  readonly title: string;
  readonly owner: string;
  readonly location: string;
  readonly notes: string;
}
