-- Add many more exercises for a comprehensive workout library
INSERT INTO public.exercises (name, description, xp_per_set) VALUES
-- Chest Exercises
('Incline Dumbbell Press', 'Upper chest focus with adjustable bench', 8),
('Cable Crossover', 'Isolation exercise for chest definition', 7),
('Dips (Chest Focus)', 'Bodyweight exercise targeting lower chest', 9),
('Pec Deck Fly', 'Machine isolation for chest', 6),
('Decline Push-ups', 'Lower chest emphasis variation', 7),
('Landmine Press', 'Single-arm pressing movement', 8),

-- Back Exercises
('T-Bar Row', 'Thick back builder', 9),
('Face Pulls', 'Rear delt and upper back exercise', 6),
('Seal Row', 'Chest-supported rowing variation', 8),
('Straight Arm Pulldown', 'Lat isolation movement', 7),
('Inverted Row', 'Bodyweight back exercise', 8),
('Single Arm Dumbbell Row', 'Unilateral back builder', 8),

-- Shoulder Exercises
('Arnold Press', 'Dynamic shoulder press variation', 9),
('Lateral Raise', 'Side delt isolation', 6),
('Front Raise', 'Front delt emphasis', 6),
('Reverse Fly', 'Rear delt isolation', 6),
('Upright Row', 'Compound shoulder exercise', 7),
('Face Pull', 'Rear delt and upper back', 6),

-- Arms Exercises
('Preacher Curl', 'Isolated bicep exercise', 7),
('Hammer Curl', 'Brachialis focus', 7),
('Cable Curl', 'Constant tension bicep work', 7),
('Concentration Curl', 'Peak contraction bicep exercise', 6),
('Close Grip Bench Press', 'Tricep mass builder', 9),
('Overhead Tricep Extension', 'Long head tricep focus', 7),
('Cable Pushdown', 'Tricep isolation', 6),
('Diamond Push-ups', 'Bodyweight tricep exercise', 8),

-- Leg Exercises
('Bulgarian Split Squat', 'Single leg strength builder', 10),
('Leg Curl', 'Hamstring isolation', 7),
('Leg Extension', 'Quad isolation', 7),
('Calf Raise', 'Calf development', 6),
('Hip Thrust', 'Glute builder', 9),
('Walking Lunges', 'Dynamic leg exercise', 8),
('Sumo Deadlift', 'Wide stance deadlift variation', 10),
('Goblet Squat', 'Front-loaded squat', 8),

-- Core Exercises
('Russian Twist', 'Oblique exercise', 6),
('Mountain Climbers', 'Dynamic core and cardio', 7),
('Bicycle Crunches', 'Ab and oblique exercise', 6),
('V-Ups', 'Advanced core movement', 8),
('Leg Raises', 'Lower ab focus', 7),
('Ab Wheel Rollout', 'Advanced ab exercise', 9),
('Side Plank', 'Oblique and stability', 7),

-- Cardio/Functional
('Jump Rope', 'High-intensity cardio', 5),
('Box Jumps', 'Explosive leg power', 8),
('Kettlebell Swing', 'Full body power exercise', 8),
('Battle Ropes', 'Upper body cardio', 7),
('Medicine Ball Slam', 'Full body power', 7),
('Farmers Walk', 'Grip and core strength', 8),
('Sled Push', 'Lower body power', 9),
('Rowing Machine', 'Full body cardio', 6),

-- Olympic Lifts
('Clean and Press', 'Full body power movement', 12),
('Snatch', 'Olympic lift', 15),
('Clean and Jerk', 'Olympic lift', 15),
('Power Clean', 'Explosive pulling movement', 12),
('Hang Clean', 'Partial range clean', 10),

-- Bodyweight
('Handstand Push-ups', 'Advanced shoulder exercise', 12),
('Muscle-ups', 'Advanced pull and push combo', 15),
('L-Sit', 'Core and hip flexor strength', 10),
('Pistol Squat', 'Single leg squat', 12),
('Dragon Flag', 'Advanced core exercise', 15)
ON CONFLICT (name) DO NOTHING;