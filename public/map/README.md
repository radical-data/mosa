# Local map geography

`natural-earth-land-110m.geojson` is the Natural Earth 1:110m physical land layer (dataset version 4.0.0), converted from `ne_110m_land.zip` with GDAL `ogr2ogr` using RFC 7946 GeoJSON and three decimal places.

Natural Earth data is in the public domain. Dataset source: [Natural Earth 1:110m physical vectors](https://www.naturalearthdata.com/downloads/110m-physical-vectors/110m-land/). Original download: `https://naturalearth.s3.amazonaws.com/110m_physical/ne_110m_land.zip`.

To refresh the bundled data, download the current land archive from the source above, extract it, then run:

```sh
ogr2ogr -f GeoJSON natural-earth-land-110m.geojson ne_110m_land.shp -lco RFC7946=YES -lco COORDINATE_PRECISION=3
```

The Visit map reads this file locally. It does not request remote tiles, styles, glyphs, fonts or sprites.
