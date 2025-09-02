# RN Maps Clustering

[![npm version](https://img.shields.io/npm/v/rn-maps-clustering.svg)](https://www.npmjs.com/package/rn-maps-clustering)
[![npm downloads](https://img.shields.io/npm/dm/rn-maps-clustering.svg)](https://www.npmjs.com/package/rn-maps-clustering)
[![license](https://img.shields.io/npm/l/rn-maps-clustering.svg)](https://github.com/suwi-lanji/rn-maps-clustering/blob/main/LICENSE)

A modern, performant, and fully-typed map clustering library for React Native. Built on top of the battle-tested [`supercluster`](https://github.com/mapbox/supercluster) library, `RN Maps Clustering` provides a simple, declarative API for adding beautiful and efficient marker clustering to your `react-native-maps` components.


## ✨ Features

- **High Performance:** Leverages `supercluster` for lightning-fast clustering of thousands of points.
- **Fully Typed:** Written entirely in TypeScript for a superior developer experience.
- **Declarative API:** Works just like `react-native-maps`. Simply wrap your `<Marker />` components.
- **Customizable:** Easily provide a custom component to render clusters.
- **Spiderfier:** Automatically spreads out markers at max zoom level for easy interaction.
- **Modern:** Built with modern React hooks and best practices.

## 🚀 Installation

1.  Install the library and its peer dependencies:

    ```bash
    npm install rn-maps-clustering react-native-maps
    # or
    yarn add rn-maps-clustering react-native-maps
    # or
    pnpm add rn-maps-clustering react-native-maps
    ```

2.  Follow the installation instructions for [`react-native-maps`](https://github.com/react-native-maps/react-native-maps/blob/master/docs/installation.md).

## 💡 Usage

Using `RN Maps Clustering` is as simple as replacing `<MapView />` with `<ClusteredMapView />`.

```tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import ClusteredMapView from 'rn-maps-clustering';

// Your marker data
const markers = [
  { latitude: 37.78825, longitude: -122.4324 },
  { latitude: 37.75825, longitude: -122.4224 },
  // ... more markers
];

const App = () => (
  <ClusteredMapView
    style={styles.map}
    initialRegion={{
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }}
  >
    {markers.map((marker, index) => (
      <Marker key={index} coordinate={marker} />
    ))}
  </ClusteredMapView>
);

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default App;
```
## 🎨 Customization

You can easily customize the appearance of clusters and handle press events.

### Custom Cluster Component

Pass a `renderCluster` prop to render your own custom cluster component. The function receives the `cluster` object and an `onPress` handler.

```tsx
import { View, Text } from 'react-native';
import { Marker } from 'react-native-maps';

<ClusteredMapView
  // ...
  renderCluster={(cluster, onPress) => (
    <Marker
      key={`cluster-${cluster.id}`}
      coordinate={{
        longitude: cluster.geometry.coordinates[0],
        latitude: cluster.geometry.coordinates[1],
      }}
      onPress={onPress}
    >
      <View style={myStyles.customCluster}>
        <Text style={myStyles.clusterText}>
          {cluster.properties.point_count_abbreviated}
        </Text>
      </View>
    </Marker>
  )}
>
  {/* ... markers */}
</ClusteredMapView>
```

### Cluster Press Event

Use the `onClusterPress` prop to get information about a pressed cluster and its children.

```tsx
<ClusteredMapView
  // ...
  onClusterPress={(cluster, children) => {
    console.log('Cluster Pressed!', { cluster, children });
  }}
>
  {/* ... markers */}
</ClusteredMapView>
```

## Props

`ClusteredMapView` accepts all standard [`MapView` props](https://github.com/react-native-maps/react-native-maps/blob/master/docs/mapview.md) plus the following:

| Prop                 | Type                                            | Default     | Description                                                               |
| -------------------- | ----------------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| `clusteringEnabled`  | `boolean`                                       | `true`      | Toggles clustering functionality.                                         |
| `radius`             | `number`                                        | `40`        | Cluster radius in pixels.                                                 |
| `maxZoom`            | `number`                                        | `20`        | Maximum zoom level to cluster points.                                     |
| `minPoints`          | `number`                                        | `2`         | The minimum number of points to form a cluster.                           |
| `onClusterPress`     | `(cluster, children) => void`                   | `undefined` | Callback when a cluster is pressed.                                       |
| `renderCluster`      | `(cluster, onPress) => React.ReactNode`         | `undefined` | A function to render a custom cluster marker.                             |
| `spiralEnabled`      | `boolean`                                       | `true`      | Spreads out markers at max zoom.                                          |
| `clusterColor`       | `string`                                        | `#00B386`   | The color for the default cluster marker.                                 |
| `clusterTextColor`   | `string`                                        | `#FFFFFF`   | The color for the text on the default cluster marker.                     |

... and more `supercluster` options (`minZoom`, `extent`, `nodeSize`).

## 🤝 Contributing

Contributions are welcome! Please see the [Contributing Guide](CONTRIBUTING.md) for more details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
