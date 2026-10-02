export type Activity = 'animation' | 'theory' | 'experiment' | 'code';
export type LessonRoute = { index: number; view: Activity; library: boolean; scene: number };
type LessonPath = { id: string; scenes: readonly unknown[] };

export function readRoute(search: string, lessons: readonly LessonPath[], fallback = 0): LessonRoute {
  const params = new URLSearchParams(search);
  const found = lessons.findIndex(lesson => lesson.id === params.get('lesson'));
  const index = found >= 0 ? found : Math.max(0, Math.min(lessons.length - 1, fallback));
  const activity = params.get('activity');
  const view: Activity = activity === 'theory' || activity === 'experiment' || activity === 'code' ? activity : 'animation';
  const requestedScene = Number(params.get('scene') || 1);
  const scene = Number.isInteger(requestedScene) ? Math.max(0, Math.min(lessons[index].scenes.length - 1, requestedScene - 1)) : 0;
  return { index, view, library: params.get('guide') === '1', scene };
}

export function routeSearch(route: LessonRoute, lessons: readonly LessonPath[]): string {
  const params = new URLSearchParams({ lesson: lessons[route.index].id, activity: route.view, scene: String(route.scene + 1) });
  if (route.library) params.set('guide', '1');
  return `?${params}`;
}
