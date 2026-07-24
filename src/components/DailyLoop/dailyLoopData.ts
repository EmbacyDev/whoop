import loop1Video from '../../assets/images/dayloop/Daily Loop 1-desktop-1_new.mp4';
import loop1Overlay from '../../assets/images/dayloop/Daily Loop 1-desktop-2.png';
import loop2Video from '../../assets/images/dayloop/Daily Loop 2-desktop-1_new.mp4';
import loop2Overlay from '../../assets/images/dayloop/Daily Loop 2-desktop-2.png';
import loop3Video from '../../assets/images/dayloop/Daily Loop 3-desktop-1_new.mp4';
import loop3Overlay from '../../assets/images/dayloop/Daily Loop 3-desktop-2.png';
import loop4Video from '../../assets/images/dayloop/Daily Loop 4-desktop-1_new.mp4';
import loop4Overlay from '../../assets/images/dayloop/Daily Loop 4-desktop-2.png';

export type DailyLoopState = {
  id: string;
  /** Active-hour label shown in the highlighted timeline pill. */
  hour: string;
  pillLabel: string;
  description: string;
  /** Background video (`*-desktop-1`). */
  video: string;
  /** Transparent PNG overlay on top of the video (`*-desktop-2`). */
  overlay: string;
  imageAlt: string;
};

function formatHourLabel(hour24: number, minute = 0): string {
  const period = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const hh = String(hour12).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm} ${period}`;
}

/** Full-day wheel marks (hourly), plus the 06:30 PM stop used by Strain Clearance.
 *  Trailing 12:00 AM closes the day so the label appears below 11:00 PM
 *  in the final Evening Recap state. */
export const timelineHours: string[] = (() => {
  const hours: string[] = [];
  for (let h = 0; h < 24; h += 1) {
    hours.push(formatHourLabel(h));
    if (h === 18) hours.push(formatHourLabel(18, 30));
  }
  // End-of-day midnight (distinct from the opening 12:00 AM at index 0).
  hours.push(formatHourLabel(0));
  return hours;
})();

/**
 * One entry per Figma "Block 3.x" desktop frame.
 * Each state is a looping muted video + transparent PNG overlay.
 */
export const dailyLoopStates: DailyLoopState[] = [
  {
    id: 'morning-readiness',
    hour: '08:00 AM',
    pillLabel: 'Morning Readiness',
    description:
      'Wake up to your Sharpness score. See your day mapped into floating intervals of high productivity and required recovery.',
    video: loop1Video,
    overlay: loop1Overlay,
    imageAlt: 'Hands holding a phone showing a calendar day, with a Sharpness score of 94%',
  },
  {
    id: 'real-time-guidance',
    hour: '02:00 PM',
    pillLabel: 'Real-Time Guidance',
    description:
      'Meeting ran long? HRV dropping? AI Coach sends a soft, contextual prompt suggesting a 15-minute reset before your next big focus block.',
    video: loop2Video,
    overlay: loop2Overlay,
    imageAlt: 'A man in a meeting receiving an AI Coach prompt to take a 15-minute reset',
  },
  {
    id: 'strain-clearance',
    hour: '06:30 PM',
    pillLabel: 'Strain Clearance',
    description:
      'Work ends and recovery begins. AI Coach highlights the optimal window to shed residual cognitive fatigue through an evening workout or total disconnect.',
    video: loop3Video,
    overlay: loop3Overlay,
    imageAlt: 'A woman walking through the city at golden hour with a Recovery Window suggestion',
  },
  {
    id: 'evening-recap',
    hour: '10:00 PM',
    pillLabel: 'The Evening Recap',
    description:
      "AI reviews your day's strain against your 8-week baseline. It forecasts tomorrow's peak focus windows and suggests the optimal sleep goal to match them.",
    video: loop4Video,
    overlay: loop4Overlay,
    imageAlt: 'A man turning off a lamp before bed with a Performance Insight about sleep',
  },
];
