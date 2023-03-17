// From https://act.ucsd.edu/webreg2/js/webreg/webreg-main.js `convInstType`
// See also, https://registrar.ucsd.edu/StudentLink/instr_codes.html

export const exams = {
  FI: 'Final Exam',
  MI: 'Midterm',
  FM: 'Film Sessions',
  PB: 'Problem Sessions',
  OT: 'Other Sessions',
  RE: 'Review Sessions',
  MU: 'Make-up Sessions'
}
export type ExamCodes = keyof typeof exams

export const instructionTypes = {
  LE: 'Lecture',
  DI: 'Discussion',
  LA: 'Lab',
  IN: 'Independent Study',
  SE: 'Seminar',
  AC: 'Activity',
  CL: 'Clinical Clerkship',
  CN: 'Clinic',
  CO: 'Conference',
  FW: 'Fieldwork',
  IT: 'Internship',
  OP: 'Outside Preparation',
  PR: 'Practicum',
  SA: 'Study Abroad',
  SI: 'Simultaneous Enrlmnt-Other UC',
  ST: 'Studio',
  TU: 'Tutorial',
  OT: 'Other Sessions'
}
export type InstructionCodes = keyof typeof instructionTypes

export const meetingTypes: Record<string, string> = {
  ...exams,
  ...instructionTypes
}
