import test from 'node:test';
import assert from 'node:assert/strict';
import { readRoute, routeSearch } from '../src/lib/navigation.ts';

const lessons = [{ id: 'symmetric', scenes: Array(6) }, { id: 'hashing', scenes: Array(6) }];

test('lesson, activity, scene and guide URLs restore the same view', () => {
  for (const view of ['animation', 'theory', 'experiment', 'code']) {
    const route = { index: 1, view, scene: 4, library: false };
    assert.deepEqual(readRoute(routeSearch(route, lessons), lessons), route);
    assert.deepEqual(readRoute(routeSearch({ ...route, library: true }, lessons), lessons), { ...route, library: true });
  }
});

test('invalid URLs stay within the available lessons and scenes', () => {
  assert.deepEqual(readRoute('?lesson=missing&activity=missing&scene=-8', lessons, 1), { index: 1, view: 'animation', scene: 0, library: false });
  assert.equal(readRoute('?lesson=hashing&scene=999', lessons).scene, 5);
  assert.equal(readRoute('?scene=NaN', lessons).scene, 0);
  assert.equal(readRoute('?scene=1.5', lessons).scene, 0);
});
