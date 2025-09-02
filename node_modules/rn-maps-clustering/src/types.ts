import type Supercluster from 'supercluster';

export type InputPointFeature = GeoJSON.Feature<
  GeoJSON.Point,
  {
    index: number;
    [key: string]: any;
  }
>;

export type ClusterFeature = Supercluster.ClusterFeature<{}>;
export type PointFeature = Supercluster.PointFeature<{ index: number }>;
