import Openrouteservice from 'openrouteservice-js'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-contextmenu'
import 'leaflet-contextmenu/dist/leaflet.contextmenu.min.css'
// Fixing leaflet webpack compatibility, see https://github.com/Leaflet/Leaflet/issues/4968
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css'
import 'leaflet-defaulticon-compatibility'

const LayerType = {
  MARKER: 'marker',
  ROUTE: 'route'
}

const conf = require('./config.json')

class MappingClient {
  // mapIdd: the id of the DOM element to load the map
  constructor () {
    this.orsDirections = new Openrouteservice.Directions({
      api_key: conf.API_TOKEN
    })
    this.Geocode = new Openrouteservice.Geocode({
      api_key: conf.API_TOKEN
    })
    this.orsUtil = new Openrouteservice.Util()
    const self = this

    // Add an autocomplete function to the SDK
    this.Geocode.autocomplete = function (reqArgs) {
      // Get custom header and remove from args
      this.customHeaders = []
      if (reqArgs.customHeaders) {
        this.customHeaders = reqArgs.customHeaders
        delete reqArgs.customHeaders
      }
      self.orsUtil.setRequestDefaults(this.args, reqArgs)
      reqArgs.service = 'geocode/autocomplete'
      self.orsUtil.copyProperties(reqArgs, this.args)
      return this.geocodePromise()
    }

    // Create data structures for map objects
    this.idCounter = 0
    this.mapObjects = {}
    this.stops = []
  }

  initMap (mapId) {
    // Initialize Leaflet
    this.map = L.map(mapId, {
      contextmenu: true,
      contextmenuWidth: 140,
      contextmenuItems: [
        {
          text: 'Add marker',
          callback: (e) => this.addMarker('', e.latlng)
        },
        {
          text: 'Add route',
          callback: (e) => {
            this.addMarker('', e.latlng)
            this.stops.push(e.latlng)
            if (this.stops.length === 2) {
              this.plotRouteFromCoordinates(this.stops[0], this.stops[1])
            }
          }
        }
      ]
    }).setView({ lon: 0, lat: 0 }, 2)

    // add the OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(this.map)

    // show the scale bar on the lower left corner
    L.control.scale().addTo(this.map)
  }

  getNextMapObjectId () {
    return this.idCounter++
  }

  deleteLayer (e) {
    console.debug('deleting layer')
    this.remove()
  }

  renameObject (id, newName) {
    console.debug('renaming layer ' + newName)
    this.mapObjects[id].label = newName
  }

  createLayer (object) {
    let layerConstructor
    let layerData
    switch (object.type) {
      case LayerType.MARKER: layerConstructor = L.marker; layerData = { lon: object.lng, lat: object.lat }; break
      case LayerType.ROUTE: layerConstructor = L.geoJson; layerData = object.geojson; break
    }
    const layer = layerConstructor(layerData, {
      contextmenu: true,
      contextmenuWidth: 140,
      contextmenuItems: [
        {
          text: 'Delete',
          callback: this.deleteLayer
        }
      ]
    })
    layer.options.contextmenuItems[0].context = layer
    return layer
  }

  createLabelInput (id, label) {
    // '<input class="labelInput" type="text" value="' + label + '"></input>'
    const self = this
    const input = document.createElement('input')
    input.setAttribute('type', 'text')
    input.setAttribute('value', label)
    input.className = 'labelInput'
    input.addEventListener('input', (e) => {
      self.renameObject(id, e.target.value)
    })
    return input
  }

  addMarker (label, coordinates) {
    console.debug('adding marker "" with coordinates: ' + coordinates)
    const mapObject = {
      type: LayerType.MARKER,
      label: label,
      lng: coordinates.lng,
      lat: coordinates.lat
    }
    const layer = this.createLayer(mapObject)
    mapObject.layer = layer
    const id = this.getNextMapObjectId()
    this.mapObjects[id] = mapObject
    layer.addTo(this.map)
    const popup = L.popup({ className: 'labelPopup' }).setContent(this.createLabelInput(id, label))
    layer.bindPopup(popup).openPopup()
  }

  addRoute (geojson) {
    console.debug('adding route ')
    const mapObject = {
      type: LayerType.ROUTE,
      geojson: geojson
    }
    const layer = this.createLayer(mapObject)
    mapObject.layer = layer
    const id = this.getNextMapObjectId()
    this.mapObjects[id] = mapObject
    layer.addTo(this.map)
  }

  searchAndAddMarker (text) {
    console.debug('Searching for' + text)
    const self = this
    this.Geocode.geocode({
      text: text,
      size: 1
    })
      .then(function (geojson) {
        console.debug(
          'Plotting point with coordinates ' +
            geojson.features[0].geometry.coordinates
        )
        const coords = geojson.features[0].geometry.coordinates
        self.addMarker(text, { lng: coords[0], lat: coords[1] })
      })
      .catch(function (err) {
        console.error(err)
      })
  }

  plotRouteFromCoordinates (origin, destination) {
    console.debug('plotting route between ' + origin + ' and ' + destination)
    const self = this
    this.orsDirections
      .calculate({
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat]
        ],
        profile: 'driving-car',
        instructions: 'false',
        format: 'geojson'
      })
      .then(function (geojson) {
        console.debug('plotting route :')
        console.debug(geojson)
        self.addRoute(geojson)
      })
      .catch(function (err) {
        console.error(err)
      })
  }

  plotRouteFromText (pointA, pointB) {
    console.debug('searching for route between ' + pointA + ' and ' + pointB)
    const self = this
    Promise.allSettled([
      this.Geocode.geocode({
        text: pointA,
        size: 1
      }),
      this.Geocode.geocode({
        text: pointB,
        size: 1
      })
    ])
      .then(function (response) {
        const origin = self.getLatLngFromGeojson(response[0])
        const destination = self.getLatLngFromGeojson(response[1])
        self.plotPointFromCoordinates(origin)
        self.plotPointFromCoordinates(destination)
        self.plotRouteFromCoordinates(origin, destination)
      })
      .catch(function (err) {
        console.error(err)
      })
  }

  getAutocomplete (text, callback) {
    console.debug('searching autocomplete for ' + text)
    this.Geocode.autocomplete({
      text: text,
      size: 10
    })
      .then(function (result) {
        console.debug(result)
        const suggestions = {}
        result.features.forEach((feature) => {
          suggestions[feature.properties.label] = {
            lng: feature.geometry.coordinates[0],
            lat: feature.geometry.coordinates[1]
          }
        })
        callback(suggestions)
      })
      .catch(function (err) {
        console.error(err)
      })
  }

  getMaps (callback) {
    console.debug('getting map list')
    fetch(conf.TRAVELMAP_API_ROOT + '/maps/')
      .then(response => response.json())
      .then(maps => callback(maps))
      .catch(function (err) {
        console.error(err)
      })
  }

  clearMap () {
    this.map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        console.debug('removing layer')
        layer.remove()
      }
    })
  }

  saveMap (mapId) {
    mapId = 1
    console.debug('Saving map with id: ' + mapId)
    const mapToSave = {
      id: mapId,
      title: 'My map',
      markers: [],
      routes: []
    }
    this.map.eachLayer((layer) => {
      if ((layer instanceof L.Marker)) {
        mapToSave.markers.push({
          lat: layer.getLatLng().lat,
          lng: layer.getLatLng().lng
        })
      }
      if ((layer instanceof L.GeoJSON)) {
        mapToSave.routes.push({
          geoJson: layer.toGeoJSON()
        })
      }
    })
    fetch(conf.TRAVELMAP_API_ROOT + '/maps/' + mapId + '/', {
      method: 'PUT',
      body: JSON.stringify(mapToSave),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(function (result) {
        console.debug('Map saved')
      })
      .catch(function (err) {
        console.error(err)
      })
  }

  loadMap (mapId) {
    const self = this
    const loadingApi = conf.TRAVELMAP_API_ROOT + '/maps/' + mapId
    fetch(loadingApi + '/markers/')
      .then(response => response.json())
      .then(markers => {
        markers.forEach(marker => {
          console.debug('loading marker')
          self.addLayer(LayerType.MARKER, marker)
        })
      })
      .catch(function (err) {
        console.error(err)
      })
    fetch(conf.TRAVELMAP_API_ROOT + '/maps/' + mapId + '/routes/')
      .then(response => response.json())
      .then(routes => {
        routes.forEach(route => {
          console.debug('loading route')
          self.addLayer(LayerType.ROUTE, route.geoJson)
        })
      })
      .catch(function (err) {
        console.error(err)
      })
  }

  getLatLngFromGeojson (geojson) {
    return {
      lng: geojson.value.features[0].geometry.coordinates[0],
      lat: geojson.value.features[0].geometry.coordinates[1]
    }
  }
}

export default MappingClient
