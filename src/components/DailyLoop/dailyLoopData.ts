import state1Morning from '../../assets/images/dayloop/state-1-morning.jpg';
import state2Guidance from '../../assets/images/dayloop/state-2-guidance.jpg';
import state3Clearance from '../../assets/images/dayloop/state-3-clearance.jpg';
import state4Recap from '../../assets/images/dayloop/state-4-recap.jpg';

export type DailyLoopState = {
  id: string;
  /** Active-hour label shown in the highlighted timeline pill. */
  hour: string;
  pillLabel: string;
  description: string;
  image: string;
  imageAlt: string;
};

function formatHourLabel(hour24: number, minute = 0): string {
  const period = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const hh = String(hour12).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm} ${period}`;
}

/** Full-day wheel marks (hourly), plus the 06:30 PM stop used by Strain Clearance. */
export const timelineHours: string[] = (() => {
  const hours: string[] = [];
  for (let h = 0; h < 24; h += 1) {
    hours.push(formatHourLabel(h));
    if (h === 18) hours.push(formatHourLabel(18, 30));
  }
  return hours;
})();

/**
 * One entry per Figma "Block 3.x" desktop frame. UI cards (Sharpness, AI Coach,
 * etc.) are baked into the photos — only the pill + description stay as HTML.
 */
export const dailyLoopStates: DailyLoopState[] = [
  {
    id: 'morning-readiness',
    hour: '08:00 AM',
    pillLabel: 'Morning Readiness',
    description:
      'Wake up to your Sharpness score. See your day mapped into floating intervals of high productivity and required recovery.',
    image: state1Morning,
    imageAlt: 'Hands holding a phone showing a calendar day, with a Sharpness score of 94%',
  },
  {
    id: 'real-time-guidance',
    hour: '02:00 PM',
    pillLabel: 'Real-Time Guidance',
    description:
      'Meeting ran long? HRV dropping? AI Coach sends a soft, contextual prompt suggesting a 15-minute reset before your next big focus block.',
    image: state2Guidance,
    imageAlt: 'A man in a meeting receiving an AI Coach prompt to take a 15-minute reset',
  },
  {
    id: 'strain-clearance',
    hour: '06:30 PM',
    pillLabel: 'Strain Clearance',
    description:
      'Work ends and recovery begins. AI Coach highlights the optimal window to shed residual cognitive fatigue through an evening workout or total disconnect.',
    image: state3Clearance,
    imageAlt: 'A woman walking through the city at golden hour with a Recovery Window suggestion',
  },
  {
    id: 'evening-recap',
    hour: '10:00 PM',
    pillLabel: 'The Evening Recap',
    description:
      "AI reviews your day's strain against your 8-week baseline. It forecasts tomorrow's peak focus windows and suggests the optimal sleep goal to match them.",
    image: state4Recap,
    imageAlt: 'A man turning off a lamp before bed with a Performance Insight about sleep',
  },
];
