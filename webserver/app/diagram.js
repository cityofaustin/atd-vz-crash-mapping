require('dotenv').config()

import $ from 'jquery'
import fs from 'fs'

import Clipper from 'image-clipper' 
import Jimp from 'jimp/es'

import Map from 'ol/Map'
import {Icon, Style, Fill, Stroke, RegularShape} from 'ol/style'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import {fromLonLat} from 'ol/proj'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import MousePosition from 'ol/control/MousePosition'
import {createStringXY} from 'ol/coordinate'
import {defaults as defaultControls} from 'ol/control'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import TileDebug from 'ol/source/TileDebug'
import View from 'ol/View'
import Moment from 'moment'
import Select from 'ol/interaction/Select'
import {altKeyOnly, click, pointerMove} from 'ol/events/condition'


export function initiate_map() {
  var mousePositionControl = new MousePosition({
  coordinateFormat: createStringXY(4),
  projection: 'EPSG:4326',
  undefinedHTML: '&nbsp',
  })

  let diagram_layer = new VectorLayer({
    title: 'Diagram Layer',
    visible: true,
    source: new VectorSource(),
    })
  diagram_layer['name'] = 'Diagram Layer'

  var map = new Map({
    controls: defaultControls().extend([mousePositionControl]),
    layers: [
      new TileLayer({
        title: 'WhiteBackground',
        visible: true,
        opacity: 1,
        source: new XYZ({
          url: process.env.WHITE_TILE,
          maxZoom: 22,
          crossOrigin: "Anonymous",
          }),
        }),
      new TileLayer({
        title: 'Satellite',
        visible: true,
        opacity: 0.45,
        source: new XYZ({
          url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=' + process.env.MAPBOX_API_KEY,
          maxZoom: 22,
          crossOrigin: "Anonymous",
          }),
        //source: new XYZ({
          //url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          //maxZoom: 19
          //}),
        //source: new BingMaps({
          //key: 'AuX_MBG_d9B81VC70V-bUUlAL5b6Alpsrfi4f4oLUpWOCgLdjKQ_cN-mUP3XnjDj',
          //imagerySet: 'Aerial'
          //}),
        }),
      new TileLayer({
        title: 'Streets',
        visible: true,
        opacity: 1,
        source: new XYZ({
          url: process.env.OSM_TILE_URL + '{z}/{x}/{y}.png',
          maxZoom: 20,
          crossOrigin: "Anonymous",
          }),
        }),
        new TileLayer(
          {
          title: 'Debug',
          visible: false,
          source: new TileDebug(),
          opacity: .7,
          }),

        diagram_layer,

        ],
      target: 'map',
      view: new View({
        //projection: 'EPSG:3857',
        //center: fromLonLat([-97.7006, 30.3670]), zoom: 20, // mearn meadows and rutland
        //center: fromLonLat([-97.8007, 30.2325]), zoom: 18, // lamar and west gate
        center: fromLonLat([-97.74055, 30.27472]), zoom: 12, // capitol
        //center: fromLonLat([-97.6627, 30.3156]), zoom: 18, // manor / sprindale & ed bluestein
        //center: fromLonLat([-97.6280, 30.2913]), zoom: 19, // decker & loyala
        //center: fromLonLat([-97.7060, 30.3217]), zoom: 18,

        maxZoom: 22,
      }),
    })
  return map
  }


export function add_icon_to_map(crash_id, loc_x, loc_y, feature_icon_scale, specified_icon, angle) {
  let color = '#000000'
  let crash_type = ''
  $('table#crashes').DataTable().data().each(function (row) {
    if (row['crash_id'] == crash_id) {
      crash_type = row['crash_type']
      if (row['k'] > 0) { color = '#0000ff' }
      else if (row['a'] > 0) { color = '#ffff00' }
      else if (row['b'] > 0) { color = '#ff0000' }
      //else { color = '#000000' } // covered by initial assignment
      }
    })

  let icon_location = ['01x01.png']
  let icon_locations = {
                                                          // column x row

    'ONE MOTOR VEHICLE - GOING STRAIGHT':                 ['01x01.png'],
    'ONE MOTOR VEHICLE - TURNING RIGHT':                  ['02x01.png'],
    'ONE MOTOR VEHICLE - TURNING LEFT':                   ['03x01.png'],
    'ONE MOTOR VEHICLE - BACKING':                        ['04x01.png'],
    //'ONE MOTOR VEHICLE - OTHER':                          [],
    'ANGLE - BOTH GOING STRAIGHT':                        ['01x02.png'],
    //'ANGLE - ONE STRAIGHT-ONE BACKING':                   [],
    'ANGLE - ONE STRAIGHT-ONE STOPPED':                   ['01x03.png'],
    'ANGLE - ONE STRAIGHT-ONE RIGHT TURN':                ['05x02.png'],
    'ANGLE - ONE STRAIGHT-ONE LEFT TURN':                 ['04x02.png'],
    'ANGLE - BOTH RIGHT TURN':                            ['03x05.png'],
    'ANGLE - ONE RIGHT TURN-ONE LEFT TURN':               ['04x05.png'],
    'ANGLE - ONE RIGHT TURN-ONE STOPPED':                 ['03x09.png'],
    'ANGLE - BOTH LEFT TURN':                             ['04x06.png'],
    'ANGLE - ONE LEFT TURN-ONE STOPPED':                  ['04x09.png'],
    'SAME DIRECTION - BOTH GOING STRAIGHT-REAR END':      ['01x03.png'],
    'SAME DIRECTION - BOTH GOING STRAIGHT-SIDESWIPE':     ['01x04.png'],
    'SAME DIRECTION - ONE STRAIGHT-ONE STOPPED':          ['01x03.png'],
    'SAME DIRECTION - ONE STRAIGHT-ONE RIGHT TURN':       ['05x03.png'],
    'SAME DIRECTION - ONE STRAIGHT-ONE LEFT TURN':        ['03x03.png'],
    'SAME DIRECTION - BOTH RIGHT TURN':                   ['05x07.png'],
    'SAME DIRECTION - ONE RIGHT TURN-ONE LEFT TURN':      ['03x07.png'],
    'SAME DIRECTION - ONE RIGHT TURN-ONE STOPPED':        ['01x07.png'],
    'SAME DIRECTION - BOTH LEFT TURN':                    ['03x08.png'],
    'SAME DIRECTION - ONE LEFT TURN-ONE STOPPED':         ['01x08.png'],
    'OPPOSITE DIRECTION - BOTH GOING STRAIGHT':           ['02x03.png'],
    'OPPOSITE DIRECTION - ONE STRAIGHT-ONE BACKING':      ['07x03.png'],
    'OPPOSITE DIRECTION - ONE STRAIGHT-ONE STOPPED':      ['02x03.png'],
    'OPPOSITE DIRECTION - ONE STRAIGHT-ONE RIGHT TURN':   ['06x03.png'],
    'OPPOSITE DIRECTION - ONE STRAIGHT-ONE LEFT TURN':    ['04x03.png'],
    'OPPOSITE DIRECTION - ONE BACKING-ONE STOPPED':       ['07x03.png'],
    'OPPOSITE DIRECTION - ONE RIGHT TURN-ONE LEFT TURN':  ['03x07.png'],
    'OPPOSITE DIRECTION - ONE RIGHT TURN-ONE STOPPED':    ['07x07.png'],
    'OPPOSITE DIRECTION - BOTH LEFT TURNS':               ['04x08.png'],
    'OPPOSITE DIRECTION - ONE LEFT TURN-ONE STOPPED':     ['02x08.png'],


    //'OTHER - ONE STRAIGHT-ONE ENTERING OR LEAVING PARKI': [],
    //'OTHER - ONE RIGHT TURN-ONE ENTERING OR LEAVING PAR': [],
    //'OTHER - ONE LEFT TURN-ONE ENTERING OR LEAVING PARK': [],
    //'OTHER - ONE ENTERING OR LEAVING PARKING SPACE-ONE':  [],
    //'OTHER - BOTH ENTERING OR LEAVING A PARKING SPACE':   [],
    //'OTHER - BOTH BACKING':                               [],
    //'OTHER':                                              [],
    //'NOT REPORTED':                                       [],
    //'UNDETERMINED - FAILED BUSINESS RULE(S)':             [],
    //'REPORTED INVALID':                                   [],
    }

  if (crash_type in icon_locations) {
    icon_location = icon_locations[crash_type]
    }
  else {
    //console.log(crash_type)
    }
   
  if (specified_icon != null) {
    //console.log('we have an icon!')
    icon_location[0] = specified_icon
    }
    
  $.post({
    url: process.env.CGI_ENDPOINT_URL,
    data: {
      query: 'get_crash_icon',
      command: JSON.stringify({crash_id: crash_id}),
      },
    }, function (data) {
      //console.log('got icon for ' + crash_id + ": " + data['icon'] + ' in row ' + data['diagram_id'])
      //console.log('app will draw: ' + icon_location[0])
      if (!data['icon']) {
        console.log('need to update: ' + data['diagram_id'] + ' to ' + icon_location[0]);

        $.post({
          url: process.env.CGI_ENDPOINT_URL,
          data: {
            query: 'set_crash_icon',
            command: JSON.stringify({id: data['diagram_id'], crash_id: crash_id, icon: icon_location[0]}),
            },
          }, function (data) {
            //console.log('update complete for ' + data)
            })
        }
      })


  //let full_path = __dirname + '/assets/diagram_icons/' + icon_location
  //console.log(full_path)
  let full_path = process.env.STATIC_DIAGRAM_ICONS_URL_PATH + icon_location[0]
  //console.log(full_path)
  //var icon_buffer
  //var icon_buffer = fs.readFileSync(__dirname + '/assets/crash_diagram_icons.png')
  var icon_buffer = fs.readFileSync(__dirname + '/assets/datepicker.css')

  Jimp.read(full_path, function (error, icons) {
    icons.color([ { apply: 'mix', params: [color, 100] } ])
    icons.getBase64(Jimp.MIME_PNG, function(err, jimp_dataUrl) {
      var view = map.getView()
      var coords = view.getCenter()
      var resolution = view.getResolution()

      var icon = new Icon({
        src: jimp_dataUrl,
        scale: feature_icon_scale * 1/Math.pow(resolution, .95),
        })

      var style = new Style({
        image: icon,
        })

      var feature = new Feature({
        geometry: new Point(fromLonLat([loc_x, loc_y])),
        })
      feature['id_'] = crash_id
      feature['color'] = color
      if (angle == undefined) {
        angle = 0
        }
      style.getImage().setRotation(-1 * angle.toFixed(2))
      feature.setStyle(style)

      map.getLayers().forEach(function(diagram_layer) {
        if ((diagram_layer instanceof VectorLayer) && diagram_layer['name'] == 'Diagram Layer') {
          //console.log(feature)
          diagram_layer.getSource().addFeature(feature)
          }
        })

      }) // jimp.getBase64()
    }) // jimp.read()

  return icon_location[0]
  }

export function add_icon(crash_id, loc_x, loc_y, feature_icon_scale) {
  $.post({
    url: process.env.CGI_ENDPOINT_URL,
    data: {
      query: 'get_crash_icon_parameters',
      command: JSON.stringify({crash: crash_id}),
      },
    }, function (data) {

      let specified_icon = null
      let angle = null
      let hide_crash = null

      //if (crash_id == 17920352) { // debugging hide_crash
        //console.log(crash_id)
        //console.log(data)
        //}

      if (data != null) {
        if (data['x']) { 
          //console.log('we have some geometry data for this one')
          loc_x = data['x']
          }
        if (data['y']) { 
          loc_y = data['y']
          }
        if (data['icon']) {
          specified_icon = data['icon']
          }
        if (data['angle']) {
          angle = data['angle']
          }
        if (data['hide_crash']) {
          hide_crash = data['hide_crash']
          }
        } 

      if (hide_crash != 1) {
        add_icon_to_map(crash_id, loc_x, loc_y, feature_icon_scale, specified_icon, angle)
        }
      }
    )
  }

export function update_crashes_for_extent(map, parameters) {
  //console.log('current zoom: ' + map.getView().getZoom())
  //console.log(parameters)
  let extent = map.getView().calculateExtent()

  var start_date = Moment(parameters['start_date'], 'MM/DD/YYYY')
  var end_date = Moment(parameters['end_date'], 'MM/DD/YYYY')


  if (map.getView().getZoom() >= 16)
    {
    $.post({
      url: process.env.CGI_ENDPOINT_URL,
      data: {
        extent: JSON.stringify(map.getView().calculateExtent()),
        start_date: start_date.isValid() ? start_date.format('YYYY-MM-DD') : undefined,
        end_date: end_date.isValid() ? end_date.format('YYYY-MM-DD') : undefined,
        polygon_filter: parameters['polygon_filter'],
        query: 'map_get_crash_locations',
        },
      },
      function (data) {
        //console.log(data)
        map.getLayers().forEach(function(layer) {
          if ((layer instanceof VectorLayer) && layer['name'] == 'GeoJSON Crashes') {
            let features = layer.getSource().getFeatures()
            features.forEach(function(feature) {
              layer.getSource().removeFeature(feature)
              })
            //console.log(data)
            layer.getSource().addFeatures(
              new GeoJSON().readFeatures(data)
              )
            }
          })
        }
      )
    }
  else
    {
    map.getLayers().forEach(function(layer) {
      if ((layer instanceof VectorLayer) && layer['name'] == 'GeoJSON Crashes') {
        features = layer.getSource().getFeatures()
        features.forEach(function(feature) {
          layer.getSource().removeFeature(feature)
          })
        }
      })
    }
  }
