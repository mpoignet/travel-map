import Openrouteservice from 'openrouteservice-js'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-contextmenu'
import 'leaflet-contextmenu/dist/leaflet.contextmenu.min.css'
// Fixing leaflet webpack compatibility, see https://github.com/Leaflet/Leaflet/issues/4968
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css'
import 'leaflet-defaulticon-compatibility'

const MapObjectType = {
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
          callback: (e) => this.addMarker({ label: '', lat: e.latlng.lat, lng: e.latlng.lng })
        },
        {
          text: 'Add route',
          callback: (e) => {
            this.addMarker({ label: '', lat: e.latlng.lat, lng: e.latlng.lng })
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

  deleteMapObject (id) {
    console.debug('deleting layer')
    this.mapObjects[id].layer.remove()
    delete this.mapObjects[id]
  }

  renameObject (id, newName) {
    console.debug('renaming layer ' + newName)
    this.mapObjects[id].label = newName
  }

  createLayer (id, object) {
    let layerConstructor
    let layerData
    switch (object.type) {
      case MapObjectType.MARKER: layerConstructor = L.marker; layerData = { lon: object.lng, lat: object.lat }; break
      case MapObjectType.ROUTE: layerConstructor = L.geoJson; layerData = object.geojson; break
    }
    const layer = layerConstructor(layerData, {
      contextmenu: true,
      contextmenuWidth: 140,
      contextmenuItems: [
        {
          text: 'Delete',
          callback: () => this.deleteMapObject(id)
        }
      ]
    })
    layer.options.contextmenuItems[0].context = layer

    if (object.type === MapObjectType.MARKER) {
      const popup = L.popup({ className: 'labelPopup' }).setContent(this.createLabelInput(id, object.label))
      layer.bindPopup(popup).openPopup()
    }

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

  addMapObject (mapObject) {
    const id = this.getNextMapObjectId()
    this.mapObjects[id] = mapObject
    const layer = this.createLayer(id, mapObject)
    mapObject.layer = layer
    layer.addTo(this.map)
  }

  addMarker (marker) {
    console.debug('adding marker "' + marker.label + '"')
    const mapObject = {
      type: MapObjectType.MARKER,
      label: marker.label,
      lng: marker.lng,
      lat: marker.lat
    }
    this.addMapObject(mapObject)
  }

  addRoute (geojson) {
    console.debug('adding route ')
    const mapObject = {
      type: MapObjectType.ROUTE,
      geojson: geojson
    }
    this.addMapObject(mapObject)
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
        self.addMarker({ label: text, lng: coords[0], lat: coords[1] })
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
    for (const id in this.mapObjects) {
      this.deleteMapObject(id)
    }
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

    for (const id in this.mapObjects) {
      const mapObject = this.mapObjects[id]
      if (mapObject.type === MapObjectType.MARKER) {
        mapToSave.markers.push({
          title: mapObject.label,
          lat: mapObject.lat,
          lng: mapObject.lng
        })
      }
      if (mapObject.type === MapObjectType.ROUTE) {
        mapToSave.routes.push({
          title: mapObject.label,
          geoJson: mapObject.geojson
        })
      }
    }
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
          self.addMarker({ label: marker.title, lat: marker.lat, lng: marker.lng })
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
          self.addRoute(route.geoJson)
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
