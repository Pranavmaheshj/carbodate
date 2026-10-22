import { ExerciseDefinition, MuscleGroup } from '../types';

export const EXERCISE_LIBRARY: ExerciseDefinition[] = [
  // CHEST
  { id: 'ex_c1', name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'barbell', instructions: 'Lie on flat bench, lower bar to mid-chest, press up firmly with elbows at 45°.' },
  { id: 'ex_c2', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'dumbbell', instructions: 'Set bench to 30-45°, press dumbbells upward while keeping chest proud.' },
  { id: 'ex_c3', name: 'Cable Chest Fly', muscleGroup: 'Chest', equipment: 'cable', instructions: 'Bring cable handles together in front of chest in a hugging motion.' },
  { id: 'ex_c4', name: 'Push-Ups', muscleGroup: 'Chest', equipment: 'bodyweight', instructions: 'Plank position, lower chest to floor, drive up maintaining rigid core.' },
  { id: 'ex_c5', name: 'Dips (Chest Focus)', muscleGroup: 'Chest', equipment: 'bodyweight', instructions: 'Lean torso forward slightly to target pectoral recruitment.' },
  { id: 'ex_c6', name: 'Pec Deck Machine', muscleGroup: 'Chest', equipment: 'machine', instructions: 'Keep forearms on pads or handles, squeeze pectorals together with peak contraction.' },

  // BACK
  { id: 'ex_b1', name: 'Barbell Deadlift', muscleGroup: 'Back', equipment: 'barbell', instructions: 'Hinge at hips, grip bar, drive through heels keeping spine neutral.' },
  { id: 'ex_b2', name: 'Barbell Bent-Over Row', muscleGroup: 'Back', equipment: 'barbell', instructions: 'Hinge forward 45°, pull bar toward belly button, squeeze shoulder blades.' },
  { id: 'ex_b3', name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'cable', instructions: 'Grip bar wide, pull down toward upper chest engaging lats, return with control.' },
  { id: 'ex_b4', name: 'Pull-Ups / Chin-Ups', muscleGroup: 'Back', equipment: 'bodyweight', instructions: 'Hang from overhead bar, pull body up until chin clears the bar.' },
  { id: 'ex_b5', name: 'Seated Cable Row', muscleGroup: 'Back', equipment: 'cable', instructions: 'Keep upright posture, pull handle to lower abdomen, hold peak squeeze 1 sec.' },
  { id: 'ex_b6', name: 'Single-Arm Dumbbell Row', muscleGroup: 'Back', equipment: 'dumbbell', instructions: 'One knee on bench, pull dumbbell to hip keeping core engaged.' },

  // SHOULDERS
  { id: 'ex_s1', name: 'Overhead Barbell Press', muscleGroup: 'Shoulder', equipment: 'barbell', instructions: 'Standing or seated, press bar overhead from clavicle to full lockout.' },
  { id: 'ex_s2', name: 'Dumbbell Lateral Raise', muscleGroup: 'Shoulder', equipment: 'dumbbell', instructions: 'Raise arms out to sides until parallel with floor, pour water angle.' },
  { id: 'ex_s3', name: 'Seated Dumbbell Shoulder Press', muscleGroup: 'Shoulder', equipment: 'dumbbell', instructions: 'Press dumbbells from shoulder height overhead, touching gently at top.' },
  { id: 'ex_s4', name: 'Face Pulls', muscleGroup: 'Shoulder', equipment: 'cable', instructions: 'Pull rope toward eyes/forehead, externally rotating shoulders.' },
  { id: 'ex_s5', name: 'Reverse Pec Deck / Rear Delt Fly', muscleGroup: 'Shoulder', equipment: 'machine', instructions: 'Target posterior deltoids by pulling arms back in a wide arc.' },

  // LEGS
  { id: 'ex_l1', name: 'Barbell Back Squat', muscleGroup: 'Legs', equipment: 'barbell', instructions: 'Bar on traps, squat down until hips break parallel, drive up through midfoot.' },
  { id: 'ex_l2', name: 'Romanian Deadlift (RDL)', muscleGroup: 'Legs', equipment: 'barbell', instructions: 'Slight knee bend, push hips back feeling deep stretch in hamstrings.' },
  { id: 'ex_l3', name: 'Leg Press', muscleGroup: 'Legs', equipment: 'machine', instructions: 'Feet shoulder-width on sled, lower carriage smoothly, don\'t lock knees at top.' },
  { id: 'ex_l4', name: 'Walking Dumbbell Lunges', muscleGroup: 'Legs', equipment: 'dumbbell', instructions: 'Step forward into 90° knee angle, drive off front heel to next step.' },
  { id: 'ex_l5', name: 'Leg Extension', muscleGroup: 'Legs', equipment: 'machine', instructions: 'Extend legs against pad to contract quadriceps, pause at top.' },
  { id: 'ex_l6', name: 'Seated / Lying Leg Curl', muscleGroup: 'Legs', equipment: 'machine', instructions: 'Curl pad toward glutes, targeting hamstrings with controlled tempo.' },
  { id: 'ex_l7', name: 'Standing Calf Raise', muscleGroup: 'Legs', equipment: 'machine', instructions: 'Full ankle dorsiflexion stretch, press onto toes with explosive calf contraction.' },

  // ARMS
  { id: 'ex_a1', name: 'Barbell Bicep Curl', muscleGroup: 'Arms', equipment: 'barbell', instructions: 'Keep elbows tucked into ribs, curl bar upward without swinging torso.' },
  { id: 'ex_a2', name: 'Incline Dumbbell Curl', muscleGroup: 'Arms', equipment: 'dumbbell', instructions: 'Reclined angle provides deep stretch on the long head of the bicep.' },
  { id: 'ex_a3', name: 'Tricep Rope Pushdown', muscleGroup: 'Arms', equipment: 'cable', instructions: 'Push rope down, spread ends apart at bottom for peak tricep contraction.' },
  { id: 'ex_a4', name: 'Skull Crushers (Lying Tricep Ext)', muscleGroup: 'Arms', equipment: 'barbell', instructions: 'Lower EZ bar to forehead/crown, extend elbows back to vertical.' },
  { id: 'ex_a5', name: 'Hammer Curls', muscleGroup: 'Arms', equipment: 'dumbbell', instructions: 'Neutral grip curl targeting brachialis and forearms.' },

  // CORE
  { id: 'ex_co1', name: 'Hanging Leg Raise', muscleGroup: 'Core', equipment: 'bodyweight', instructions: 'Hang from pull-up bar, raise straight legs or knees to parallel without swinging.' },
  { id: 'ex_co2', name: 'Cable Woodchopper', muscleGroup: 'Core', equipment: 'cable', instructions: 'Rotate torso diagonally across body, engaging obliques and transverse abs.' },
  { id: 'ex_co3', name: 'Plank', muscleGroup: 'Core', equipment: 'bodyweight', instructions: 'Hold prone forearm plank, maintaining straight line from head to heels.' },
  { id: 'ex_co4', name: 'Ab Wheel Rollout', muscleGroup: 'Core', equipment: 'other', instructions: 'Kneel and roll wheel forward as far as comfortable, pull back using core.' },

  // FULL BODY
  { id: 'ex_f1', name: 'Kettlebell Swings', muscleGroup: 'Full body', equipment: 'kettlebell', instructions: 'Hinge hips explosively to swing kettlebell to chest level.' },
  { id: 'ex_f2', name: 'Clean and Press', muscleGroup: 'Full body', equipment: 'barbell', instructions: 'Olympic lift pulling bar to shoulders, followed by overhead press.' },
  { id: 'ex_f3', name: 'Thrusters', muscleGroup: 'Full body', equipment: 'barbell', instructions: 'Full front squat directly transitioning into explosive overhead push press.' },
];

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulder',
  'Legs',
  'Arms',
  'Core',
  'Full body',
];

export const SPLIT_OPTIONS = [
  'Push (Chest/Shoulder/Triceps)',
  'Pull (Back/Biceps)',
  'Legs & Core',
  'Upper Body',
  'Lower Body',
  'Full Body',
  'Chest & Triceps',
  'Back & Biceps',
  'Shoulders & Arms',
  'Custom Split',
];

