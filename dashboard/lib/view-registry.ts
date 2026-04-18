import type { ComponentType } from 'react';
import TimelineView from '../components/TimelineView';
import GridView from '../components/GridView';
import KVListView from '../components/KVListView';
import type { IndexedFile } from './fs-index';
import type { ViewType } from './region-manifest';

export interface ViewProps {
  files: IndexedFile[];
  region: string;
}

const registry: Record<ViewType, ComponentType<ViewProps>> = {
  timeline: TimelineView,
  grid: GridView,
  'kv-list': KVListView
};

export function getView(viewType: ViewType): ComponentType<ViewProps> {
  return registry[viewType] ?? TimelineView;
}
