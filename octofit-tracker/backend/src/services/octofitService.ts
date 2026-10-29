import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Activity details are required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  const objectIdPattern = /^[0-9a-f]{24}$/i;
  if (typeof userId !== 'string' || !objectIdPattern.test(userId)
    || typeof teamId !== 'string' || !objectIdPattern.test(teamId)
    || typeof type !== 'string' || !type.trim()
    || typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('Valid user, team, type, and minutes are required'), { status: 400 });
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Activity user and team must exist'), { status: 400 });
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw Object.assign(new Error('Team details are required'), { status: 400 });
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim() || typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team name and mascot are required'), { status: 400 });
  }
  if (members !== undefined && !Array.isArray(members)) {
    throw Object.assign(new Error('Team members must be an array'), { status: 400 });
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: members ?? [],
  });
  return team.toObject();
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        let: { teamId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$team', '$$teamId'] } } },
          { $group: { _id: null, totalPoints: { $sum: '$points' } } },
        ],
        as: 'activityTotals',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $ifNull: [{ $arrayElemAt: ['$activityTotals.totalPoints', 0] }, 0] },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(10)
    .lean();
  const activityFocus: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    strength: 'strength',
    walk: 'mobility',
  };
  const focusForActivity = (type: string) => activityFocus[type.toLowerCase()] ?? type.toLowerCase();
  const preferredFocuses = [...new Set([
    user.fitnessGoal.toLowerCase(),
    ...recentActivities.map(({ type }) => focusForActivity(type)),
  ])];

  const workouts = await Workout.find({ focus: { $in: preferredFocuses } }).lean();
  workouts.sort((left, right) => preferredFocuses.indexOf(left.focus.toLowerCase()) - preferredFocuses.indexOf(right.focus.toLowerCase()));

  return workouts.map((workout) => {
    const matchingActivity = recentActivities.find(({ type }) => focusForActivity(type) === workout.focus.toLowerCase());
    const reason = workout.focus.toLowerCase() === user.fitnessGoal.toLowerCase()
      ? `Recommended for your ${workout.focus} goal.`
      : `Recommended based on your recent ${matchingActivity?.type ?? workout.focus} activity.`;
    return { ...workout, reason };
  });
}

export { User };
