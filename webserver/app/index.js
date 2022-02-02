require('dotenv').config()

import $ from 'jquery'

import 'ol/ol.css'
import 'ol-ext/dist/ol-ext.css'
import OSM from 'ol/source/OSM'
import BingMaps from 'ol/source/BingMaps'
import VectorLayer from 'ol/layer/Vector'
import {fromLonLat} from 'ol/proj'
import * as olProj from 'ol/proj'
import VectorSource from 'ol/source/Vector'
import Transform from 'ol-ext/interaction/Transform'
import Draw from 'ol/interaction/Draw'
import GeoJSON from 'ol/format/GeoJSON'
import {Circle as CircleStyle, Fill, Stroke, Style, Icon, RegularShape, Text as TextStyle} from 'ol/style';
import Point from 'ol/Feature'
import {createStringXY} from 'ol/coordinate'
import Select from 'ol/interaction/Select'
import proj4 from 'proj4'
import {sprintf} from 'sprintf-js'
import Feature from 'ol/Feature'
import {altKeyOnly, click, pointerMove} from 'ol/events/condition'

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css' // Import precompiled Bootstrap css
import '@fortawesome/fontawesome-free/css/all.css'

import 'bootstrap-datepicker'
import './assets/datepicker.css'

//import 'datatables.net-bs4'
require( 'datatables.net-bs4')()
import 'datatables.net-bs4/css/dataTables.bootstrap4.css'

import fs from 'fs'
//var icon_buffer = fs.readFileSync(__dirname + '/assets/crash_diagram_icons.png')
var icon_buffer = fs.readFileSync(__dirname + '/assets/datepicker.css')

import Jimp from 'jimp/es'

import * as Diagram from './diagram.js'
import Moment from 'moment'
import { jsPDF } from "jspdf"
import 'viewerjs/dist/viewer.css'
import Viewer from 'viewerjs'
import { debounce } from "debounce"
//import { Tabulator } from "tabulator-tables"
import Tabulator from 'tabulator-tables';
//var Tabulator = require('tabulator-tables');


var feature_icon_scale = .050

function add_include_exclude_handler (e) {
  if ($(e['target']).hasClass('btn-success')) {
    $(e['target']).removeClass('btn-success').addClass('btn-secondary').html('X')
    $('table#crashes tr[data-crash-id=' + $(this).attr('data-crash-id') + ']').removeClass('edited')
    add_remove_crash_from_session(map['session_id'], $(this).attr('data-crash-id'), 'remove')
    var crash_id = $(this).attr('data-crash-id')
    map.getLayers().forEach(function(layer) {
      if ((layer instanceof VectorLayer) && layer['name'] == 'Diagram Layer') {
        features = layer.getSource().getFeatures()
        console.log(features)
        features.forEach(function(feature) {
          if (feature['id_'] == crash_id) {
            layer.getSource().removeFeature(feature)
            }
          })
        }
      })
    $.post({
      url: process.env.CGI_ENDPOINT_URL,
      data: {
        query: 'toggle_crash_visibility',
        command: JSON.stringify({crash: crash_id, hide_crash: 1 }),
        },
      },
      function (data) {
        //console.log(data)
        },
      )
    }
  else {
    $(e['target']).removeClass('btn-secondary').addClass('btn-success').html('&#10003;')
    add_remove_crash_from_session(map['session_id'], $(this).attr('data-crash-id'), 'add')
    var crash_id = $(this).attr('data-crash-id')
    map.getLayers().forEach(function(layer) {
      if ((layer instanceof VectorLayer) && layer['name'] == 'Diagram Layer') {
        let table = $('table#crashes').DataTable()
        var rowData = table.row($('table#crashes tr[data-crash-id=' + crash_id + ']')).data()
        let geojson = JSON.parse(rowData['geometry'])
        let feature = new GeoJSON().readFeature(geojson)
        feature['id_'] = crash_id
        //layer.getSource().addFeature(feature)
        let coordinates = proj4('EPSG:3857', 'EPSG:4326', feature.getGeometry().getCoordinates())
        Diagram.add_icon(feature['id_'], ...coordinates, feature_icon_scale)
        }
      })
    $.post({
      url: process.env.CGI_ENDPOINT_URL,
      data: {
        query: 'toggle_crash_visibility',
        command: JSON.stringify({crash: crash_id, hide_crash: 0 }),
        },
      },
      function (data) {
        //console.log(data)
        },
      )
    }
  }

function add_remove_crash_from_session (session_id, crash_id, action)
  {
  $.post({
    url: process.env.CGI_ENDPOINT_URL,
    data: {
      query: 'add_remove_crash',
      command: JSON.stringify({session: session_id, crash: crash_id, action: action}),
      },
    },
    function (data) {
      //console.log(data)
      },
    )
  }

function update_crash_icons (session_id, icons)
  {
  //console.log('update_crash_icons')
  //console.log(session_id)
  //console.log(icons)
  $.post({
    url: process.env.CGI_ENDPOINT_URL,
    data: {
      query: 'change_crash_icons',
      command: JSON.stringify({session: session_id, icons: icons}),
      },
    },
    function (data) {
      //console.log(data)
      },
    )
  }

function update_icon_angle (session_id, crash_id, angle) {
  //console.log('update_icon_angle:')
  //console.log(session_id)
  //console.log(crash_id)
  //console.log(angle)
  $.post({
    url: process.env.CGI_ENDPOINT_URL,
    data: {
      query: 'change_crash_rotation',
      command: JSON.stringify({session: session_id, crash: crash_id, angle: angle}),
      },
    },
    function (data) {
      //console.log(data)
      },
    )
  }

debounced_updated_icon_angle = debounce(update_icon_angle, 500)

function update_icon_location (session_id, crash_id, x, y) {
  //console.log('update_icon_location')
  //console.log(session_id)
  //console.log(crash_id)
  //console.log(x)
  //console.log(y)
  $.post({
    url: process.env.CGI_ENDPOINT_URL,
    data: {
      query: 'change_crash_location',
      command: JSON.stringify({session: session_id, crash: crash_id, x: x, y: y}),
      },
    },
    function (data) {
      //console.log(data)
      //$('table#crashes tr[data-crash-id=' +  
      },
    )
  }

debounced_updated_icon_location = debounce(update_icon_location, 500)

function update_icon_annotation (session_id, crash_id, annotation) {
  //var text = new Text({
    //text: 'this is the content',
    //})
  }

$('button#annotate').click(function () {
  console.log('click it!')
  let Text = new TextStyle({
    text: 'demo annotation',
    })

  map.getLayers().forEach(function(layer) {
    console.log(layer['name'])
    if ((layer instanceof VectorLayer) && layer['name'] == 'Diagram Layer') {
      features = layer.getSource().getFeatures()
      features.forEach(function(feature) {
        console.log(feature.getStyle())
        })
      }
    })
  })


$(document).ready(function () {

  let date_start = Moment(new Date()).startOf('month').subtract(Moment.duration(15, 'days')).subtract(Moment.duration(5, 'years')).startOf('month')
  //console.log(date_start.format('MM/DD/YYYY'))
  let date_end = Moment(new Date()).startOf('month').subtract(Moment.duration(2, 'days')).startOf('month').subtract(Moment.duration(1, 'days'))
  //console.log(date_end.format('MM/DD/YYYY'))

  $('input#date-start').datepicker('update', date_start.format('MM/DD/YYYY') )
    .on('blur', function (e) {
      console.log('on blur')
      console.log($('input#date-start').val())
      //$('table#crashes').DataTable().ajax.reload()
      if (!map['in_diagram']) { $('table#crashes').DataTable().ajax.reload() }
      Diagram.update_crashes_for_extent(map, {
        start_date: $('input#date-start').val(),
        end_date: $('input#date-end').val(),
        polygon_filter: map['polygon_filter'],
        })
      })
  $('input#date-end').datepicker('update', date_end.format('MM/DD/YYYY') )
    .on('blur', function (e) {
      //$('table#crashes').DataTable().ajax.reload()
      if (!map['in_diagram']) { $('table#crashes').DataTable().ajax.reload() }
      Diagram.update_crashes_for_extent(map, {
        start_date: $('input#date-start').val(),
        end_date: $('input#date-end').val(),
        polygon_filter: map['polygon_filter'],
        })
      })

  map = Diagram.initiate_map()

  var url_string = window.location.href
  var url = new URL(url_string);
  var session = url.searchParams.get("session");
  if (session)
    {
    console.log(session);
    }


  var interaction = new Transform ({
    //enableRotatedTransform: true,
    //rotate: true,
    //scale: true,
    })


  var selectAltClick = new Select({
    condition: function (mapBrowserEvent) {
      return click(mapBrowserEvent) && altKeyOnly(mapBrowserEvent);
      },
    })
  //map.removeInteraction(selectAltClick);
  map.addInteraction(selectAltClick);
  selectAltClick.on('select', function (e) {
    console.log(e.selected[0]['id_'])
    let url = 'https://visionzero.austin.gov/editor/#/crashes/' + e.selected[0]['id_']
    openInNewTab(url)
    })

  var table = $('table#crashes').DataTable({
    pageLength: 10,
    ajax: {
      serverSide: false,
      url: process.env.CGI_ENDPOINT_URL,
      data: function(d) {
        let start_date = Moment($('input#date-start').val(), 'MM/DD/YYYY')
        let end_date = Moment($('input#date-end').val(), 'MM/DD/YYYY')

        d.polygon_filter = map['polygon_filter']
        d.query = 'table_get_crash_locations' 
        d.zoom = map.getView().getZoom()
        d.extent = JSON.stringify(map.getView().calculateExtent())
        d.start_date =  start_date.isValid() ? start_date.format('YYYY-MM-DD') : undefined
        d.end_date = end_date.isValid() ? end_date.format('YYYY-MM-DD') : undefined
        },
      },
    columns: [
      {
        data: 'geometry',
        visible: false,
      },
      { 
        data: 'crash_id',
        width: '70px',
        render: function (data, type, row) {
          return "<a href='" + process.env.VZE_CRASH_URL + data + "' target=_vz_editor>" + data + "</a>"
          }
        },
      { data: 'date', width: '70px' },
      { data: 'crash_type',
        render: function ( data, type, row ) {
          let length = 30
          return data.length > length ?
          '<abbr title="' + data + '">' + data.substr( 0, length ) + '…' + '</abbr>':
          data;
          },
        },
      { data: 'k', width: '20px' },
      { data: 'a', width: '20px' },
      { data: 'b', width: '20px' },
      { 
        width: '38px',
        data: 'included',
        visible: false,
        orderable: false,
        render: function ( data, type, row ) {
          //if (row['crash_id'] == '17920352') {
            //console.log(row)
            //}
          return "<button type='button' class='btn btn-sm " + (row['hide_crash'] ? 'btn-secondary' : 'btn-success') + " include_exclude_crash' " +
                  "data-crash-id='" + row['crash_id'] + "'>&#10003;</button>";// +
                  //"<button type='button' class='btn btn-sm btn-success edit_crash' " +
                  //"data-crash-id='" + row['crash_id'] + "'>&#9998;</button>"

          },
      },
      ],
    createdRow: function (row, data, dataIndex) {
      //console.log(data)
      $(row).attr('data-crash-id', data['crash_id'])
      if (data['has_adjusted_location']) {
        $(row).addClass('edited')
        }
      },
    })

  table.on('draw', function () {
    if (map.getView().getZoom() >= 16)
      {
      $('div#zoomed-out-warning').fadeOut(200)
      $('div#datatable-row').show()

      $('table#crashes').on('mouseenter', 'tbody tr', function () {
        //if (map['in_diagram']) { return }
        var rowData = table.row(this).data()
        //console.log(rowData['geometry'])

        var mouseover_source = new VectorSource({ })
        mouseover_source.addFeatures(new GeoJSON().readFeatures(rowData['geometry']))
        var mouseover_vector_layer = new VectorLayer({ 
          source: mouseover_source ,
          style: new Style({
            image: new CircleStyle({
              radius: 10,
              fill: new Fill({color: '#FFFFFF'}),
              stroke: new Stroke({color: '#FF0000', width: 1}),
              }),
            }),
          })
        mouseover_vector_layer['name'] = 'Mouseover Crash';
        map.addLayer(mouseover_vector_layer)
        })
      $('table#crashes').on('mouseleave', 'tbody tr', function () {
        map.getLayers().forEach(function(layer) {
          if ((layer instanceof VectorLayer) && layer['name'] == 'Mouseover Crash') {
            map.removeLayer(layer)
            }
          })
        })
      }
    else
      {
      $('div#zoomed-out-warning').fadeIn(200)
      $('div#datatable-row').hide()
      }

    $('button.include_exclude_crash').off('click', add_include_exclude_handler)
    $('button.include_exclude_crash').on('click', add_include_exclude_handler)
    })

//table.on( 'xhr', function () {
  //var json = table.ajax.json();
  //console.log(json.data);
  //alert( json.data.length +' row(s) were loaded' );
  //});

  var crash_source = new VectorSource({ })
  var crash_vector_layer = new VectorLayer({ source: crash_source })
  crash_vector_layer['name'] = 'GeoJSON Crashes';
  map.addLayer(crash_vector_layer)

  //Diagram.update_crashes_for_extent()
  map.on('moveend', function(e) {
    if (!map['in_diagram']) {
      Diagram.update_crashes_for_extent(map, {
        start_date: $('input#date-start').val(),
        end_date: $('input#date-end').val(),
        polygon_filter: map['polygon_filter'],
        })
      //$('table#crashes').DataTable().ajax.reload()
      if (!map['in_diagram']) { $('table#crashes').DataTable().ajax.reload() }
      }
    })

  $('button#toggle_osm').click(function (e) {
    if ($(this).hasClass('btn-success')) {
      $(this).removeClass('btn-success').addClass('btn-secondary');
      map.getLayers().forEach(function(layer) {
        if (layer['values_']['title'] == 'Streets') {
          layer.setVisible(false)
          }
        })
      }
    else {
      $(this).removeClass('btn-secondary').addClass('btn-success');
      map.getLayers().forEach(function(layer) {
        if (layer['values_']['title'] == 'Streets') {
          layer.setVisible(true)
          }
        })
      }
    })

  $('button#draw_shape').click(function () {
    delete map['polygon_filter']
    const urlParams = new URLSearchParams(window.location.search)
    let aoi =  urlParams.get('aoi')

    if (aoi) {
      $.post({
        url: process.env.CGI_ENDPOINT_URL,
        data: {
          query: 'aoi',
          aoi: aoi, //JSON.stringify(aoi),
          },
        },
        function (data) {
          console.log(data)
          map['polygon_filter'] = data['shape']


          var shape_source = new VectorSource({
            features: new GeoJSON().readFeatures(data['shape']),
            })
          var shape_vector_layer = new VectorLayer({ source: shape_source,
                                                     style: new Style({
                                                       stroke: new Stroke({
                                                         color: 'rgba(50, 50, 50, 0.5)',
                                                         lineDash: [10,10],
                                                         width: 2,
                                                         }),
                                                       fill: new Fill({
                                                         color: 'rgba(50, 50, 50, 0.15)',
                                                         }),
                                                       })
                                                  })
          shape_vector_layer['name'] = 'shape_from_db';
          // taking the addition of this out for now; the interaction interacts with it
          //map.addLayer(shape_vector_layer)

          if (!map['in_diagram']) { $('table#crashes').DataTable().ajax.reload() }
          Diagram.update_crashes_for_extent(map, {
            start_date: $('input#date-start').val(),
            end_date: $('input#date-end').val(),
            polygon_filter: map['polygon_filter'],
            })
          }
        )
      }
    else {
      map.getLayers().forEach(function(layer) {
        if ((layer instanceof VectorLayer) && layer['name'] == 'Polygon Filter') {
          map.removeLayer(layer)
          }
        })

      var polygon_source = new VectorSource({wrapX: false})
      var polygon_vector = new VectorLayer({ source: polygon_source })
      polygon_vector['name'] = 'Polygon Filter'
      map.addLayer(polygon_vector)

      map.getInteractions().getArray().forEach(function (interaction, index) {
        if (interaction instanceof(Draw)) {
          map.getInteractions().removeAt(index)
          }
        })

      draw_interaction = new Draw({
        source: polygon_source,
        type: 'Polygon',
        })

      const format = new GeoJSON()
      draw_interaction.on('drawend', function(event) {
        let geojson = format.writeFeature(event.feature, {})
        map['polygon_filter'] = geojson;

        //fix me - deduplicate the code used here and above that does this same thing
        map.getInteractions().getArray().forEach(function (interaction, index) {
          //console.log(interaction instanceof(Draw))
          if (interaction instanceof(Draw)) {
            map.getInteractions().removeAt(index)
            }
          })

        //$('table#crashes').DataTable().ajax.reload()
        if (!map['in_diagram']) { $('table#crashes').DataTable().ajax.reload() }
        Diagram.update_crashes_for_extent(map, {
          start_date: $('input#date-start').val(),
          end_date: $('input#date-end').val(),
          polygon_filter: map['polygon_filter'],
          })
        })

      map.addInteraction(draw_interaction)
      }
    })

  $('button#diagram').click(function () {
    $('table#crashes').DataTable().column(7).visible(true)

    $('button.include_exclude_crash').off('click', add_include_exclude_handler)
    $('button.include_exclude_crash').on('click', add_include_exclude_handler)

    $('button.edit_crash').on('click', function (thing) {
      let crash_id = $(this).attr('data-crash-id')

      map.getLayers().forEach(function(layer) {
        console.log(layer['name'])
        if ((layer instanceof VectorLayer) && layer['name'] == 'Diagram Layer') {
          features = layer.getSource().getFeatures()
          features.forEach(function(feature) {
            console.log(feature)
            if (feature['id_'] == crash_id) {
              // can i really not click on something progromatically? How do you set this as the active feature in the transofrmation? 
              }
            })
          }
        })
      })


    map.getLayers().forEach(function(layer) {
      //console.log(layer)
      if ((layer instanceof VectorLayer) && layer['name'] == 'GeoJSON Crashes') {
        features = layer.getSource().getFeatures()
        let crashes = new Array
        features.forEach(function(feature) {
          //console.log(feature)
          crashes.push(feature.['values_']['f1'])
          })
        //console.log(crashes)

        $.post({
          url: process.env.CGI_ENDPOINT_URL,
          data: {
            query: 'begin_diagram',
            crashes: JSON.stringify(crashes),
            },
          },
          function (data) {
            //console.log(data)
            map['session_id'] = data['session_id']
            },
          )
        }
      })

    delete map['polygon_filter']
    map.getLayers().forEach(function(layer) {
      if ((layer instanceof VectorLayer) && layer['name'] == 'Polygon Filter') {
        map.removeLayer(layer)
        }
      })

    map['in_diagram'] = true

    let crash_icons = new Object

    //copy current geojson crashes into the diagram layer
    map.getLayers().forEach(function(diagram_layer) {
      if ((diagram_layer instanceof VectorLayer) && diagram_layer['name'] == 'Diagram Layer') {
        map.getLayers().forEach(function(geojson_layer) {
          if ((geojson_layer instanceof VectorLayer) && geojson_layer['name'] == 'GeoJSON Crashes') {
            features = geojson_layer.getSource().getFeatures()
            features.forEach(function(feature) {
              //console.log(feature)
              geojson_layer.getSource().removeFeature(feature)
              let coordinates = proj4('EPSG:3857', 'EPSG:4326', feature.getGeometry().getCoordinates())
              let icon = Diagram.add_icon(feature['id_'], ...coordinates, feature_icon_scale)
              //console.log(icon)
              crash_icons[feature['id_']] = icon
              })
            }
          })
        }
      })

    //let crash_icons = new Object
    //crash_icons[feature['id_']] = icon
    update_crash_icons(map['session_id'], crash_icons)

    var interaction = new Transform ({
      //enableRotatedTransform: true,
      //rotate: true,
      //scale: true,
      })

    map.addInteraction(interaction)

    var startangle = 0

    interaction.on('select', function (feature_event){
      //console.log(e)
      //console.log(feature_event)
      if (feature_event['feature'] == undefined) {
        $('div#datatable-row').show()
        $('div#units').empty()
        $('div#narrative, div#diagram, div#icon_pick').hide()
        }
      else {
        //console.log('selected: ' + e['feature']['id_'])
        $.post({
          url: process.env.CGI_ENDPOINT_URL,
          data: {
            query: 'crash_details',
            command: JSON.stringify({crash_id: feature_event['feature']['id_'],}),
            },
          },
          function (data) {
            //console.log(data)
            $('#units').empty()
            var table = $('<table />')
            console.log(data.units)
            for (unit of data.units) {
              if (unit.persons.length > 0) {
                for (person of unit.persons) {
                  //console.log(unit)
                  var row = $(table[0].insertRow(-1))
                  var cell = $("<td />")
                  cell.html('Unit ' + unit.unit_nbr)
                  row.append(cell)
                  if (unit.units.match(/motor vehicle/i)) {
                    var cell = $("<td />")
                    }
                  else {
                    var cell = $("<td style='background-color:#ff0000'; />")
                    }
                  cell.html(unit.units)
                  row.append(cell)
                  var cell = $("<td />")
                  cell.html('Person: ' + person.prsn_nbr)
                  row.append(cell)
                  var cell = $("<td />")
                  cell.html(person.person)
                  row.append(cell)
                  }
                }
              else
                {
                var row = $(table[0].insertRow(-1))
                var cell = $("<td />")
                cell.html('Unit ' + unit.unit_nbr)
                row.append(cell)
                var cell = $("<td />")
                cell.html(unit.units)
                row.append(cell)
                }
              }
            $('#units').append(table)

            if (data['diagram'] != null && data['narrative'] != '') {
              $('div#datatable-row').hide()

              $('div#narrative').empty().html('<h3> Crash ID: <a href="' + process.env.VZE_CRASH_URL + data['crash_id'] + '" target="_vz_editor">' + data['crash_id'] + '</a></h3><div>' + data['narrative'] + '</div>').show()
              $('div#diagram').empty().html('<img id="cr3_diagram" src="' + process.env.VZE_CR3_DIAGRAMS_URL + data['diagram'] + '">').show()
                $('img#cr3_diagram').on('click', function () {
                console.log('clicked image')
                console.log($('img#cr3_diagram')[0])
                const viewer = new Viewer($('img#cr3_diagram')[0], {
                  inline: true,
                  navbar: false,
                  })
                })
              }
            else {
              $('div#datatable-row').show()
              $('div#units').empty()
              $('div#narrative, div#diagram, div#units').hide()
              }

            $.post({
              url: process.env.CGI_ENDPOINT_URL,
              data: {
                query: 'icon_map',
                //command: JSON.stringify({crash_id: feature_event['feature']['id_'],}),
                },
              },
              function (data) {

                console.log(data)
                $('div#icon_pick').empty()
                var y, x
                for (y = 0; y < 10; y++) {
                  //$('div#icon_pick').append('<div></div>')
                  if (y % 2 == 0) {
                  $('div#icon_pick').append("<div class='row icon_row'>")
                    }
                  for (x = 0; x < 10; x++) {
                    let file = sprintf('%02d', x+1) + 'x' + sprintf('%02d', y+1) + '.png'
                    let full_url = process.env.STATIC_DIAGRAM_ICONS_URL_PATH + file
                    $('div#icon_pick div.icon_row:last').append('<div class="col"><img class="icon_picker" data-icon="' + file +'"  src="' + full_url + '" title="' + data['icons'][file]['abbreviation'] + '"></div>')
                    $('div#icon_pick img').last().on('click', function (e) {
                      let url = process.env.STATIC_DIAGRAM_ICONS_URL_PATH + $(this).attr('data-icon')
                      let icon_filename = $(this).attr('data-icon')

                      let color = '#000000'
                      Jimp.read(url, function (error, icons) {
                        icons.color([ { apply: 'mix', params: [feature_event['feature']['color'], 100] } ])
                        icons.getBase64(Jimp.MIME_PNG, function(err, jimp_dataUrl) {
                          var view = map.getView()
                          //var coords = view.getCenter()
                          var resolution = view.getResolution()

                          var icon = new Icon({
                            src: jimp_dataUrl,
                            scale: feature_icon_scale * 1/Math.pow(resolution, .95),
                            })

                          var style = new Style({
                            image: icon,
                            })

                          //console.log(feature_event)
                          feature_event['feature'].setStyle(style)

                          let crash_icons = new Object
                          crash_icons[feature_event['feature']['id_']] = icon_filename
                          update_crash_icons(map['session_id'], crash_icons)

                          }) // jimp.getBase64()
                        }) // jimp.read()

                      })
                    }
                  }

                $('div#icon_pick').show()



              })



            },
          )
        }
      })

    interaction.on('translateend', function (e){
      //console.log('translateend')
      //console.log(e.feature)
      $('table#crashes tr[data-crash-id=' + e.feature['id_'] + ']').addClass('edited')
      debounced_updated_icon_location(map['session_id'], e.feature['id_'], e.feature['values_']['geometry']['flatCoordinates'][0], e.feature['values_']['geometry']['flatCoordinates'][1])
      })

    interaction.on('rotating', function (e){
      interval = 15

      let input = ((180/Math.PI) * e.angle)
      let remainder = input % interval
      let quotient = input - remainder
      let quotient_radians = quotient * (Math.PI / 180) 

      style = e.feature.getStyle()
      style.getImage().setRotation(-1 * quotient_radians.toFixed(2))

      debounced_updated_icon_angle(map['session_id'], e.feature['id_'], quotient_radians)
      })

    var currZoom = map.getView().getZoom()
    map.on('moveend', function(e) {
      var newZoom = map.getView().getZoom()
      if (currZoom != newZoom) {
        //console.log('zoom end, new zoom: ' + newZoom)

        var view = map.getView()
        var coords = view.getCenter()
        var resolution = view.getResolution()

        map.getLayers().forEach(function(layer) {
          if ((layer instanceof VectorLayer) && layer['name'] == 'Diagram Layer') {
            //console.log(layer)
            features = layer.getSource().getFeatures()
            features.forEach(function(feature) {
              var style = feature.getStyle()
              var image = style.getImage()
              image.setScale(feature_icon_scale * 1/Math.pow(resolution, .95))
              feature.setStyle(style)
              })
            }
          })
        currZoom = newZoom
        }
      })

    //var selectSingleClick = new Select()
    //map.addInteraction(selectSingleClick)
    //selectSingleClick.on('select', function (e) {
      //console.log(e)
      //console.log('selected: ' + e.selected[0]['id_'])
      //})

    })

  $('button#pdf').click(function () {
    //const doc = new jsPDF()
    //doc.text("Hello world!", 10, 10)
    //doc.save("a4.pdf")
    //doc.output('dataurlnewwindow')
    //var dim = [279, 216] // letter paper 

    //exportButton.disabled = true;
    document.body.style.cursor = 'progress';

    //var format = document.getElementById('format').value;
    var format = 'letter'
    //var resolution = document.getElementById('resolution').value;
    var resolution = 150
    //var dim = dims[format];
    var dim = [259, 196] // letter paper 
    var width = Math.round((dim[0] * resolution) / 25.4);
    var height = Math.round((dim[1] * resolution) / 25.4);
    var size = map.getSize();
    var viewResolution = map.getView().getResolution();

    map.once('rendercomplete', function () {
      var mapCanvas = document.createElement('canvas');
      mapCanvas.width = width;
      mapCanvas.height = height;
      var mapContext = mapCanvas.getContext('2d');
      Array.prototype.forEach.call(
        document.querySelectorAll('.ol-layer canvas'),
        function (canvas) {
          if (canvas.width > 0) {
            var opacity = canvas.parentNode.style.opacity;
            mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
            var transform = canvas.style.transform;
            // Get the transform parameters from the style's transform matrix
            var matrix = transform
              .match(/^matrix\(([^\(]*)\)$/)[1]
              .split(',')
              .map(Number);
            // Apply the transform to the export map context
            CanvasRenderingContext2D.prototype.setTransform.apply(
              mapContext,
              matrix
            );
            mapContext.drawImage(canvas, 0, 0);
          }
        }
      );
      var pdf = new jsPDF('landscape', undefined, format);
      pdf.addImage(
        mapCanvas.toDataURL('image/jpeg'),
        'JPEG',
        10,
        10,
        dim[0],
        dim[1]
      );
      //pdf.save('map.pdf');
      pdf.output('dataurlnewwindow')
      // Reset original map size
      map.setSize(size);
      map.getView().setResolution(viewResolution);
      //exportButton.disabled = false;
      document.body.style.cursor = 'auto';
    });

    // Set print size
    var printSize = [width, height];
    map.setSize(printSize);
    var scaling = Math.min(width / size[0], height / size[1]);
    map.getView().setResolution(viewResolution / scaling);

    //pdf.save('map.pdf');
    //pdf.output('dataurlnewwindow')
    })


  })


function openInNewTab(url) {
  var win = window.open(url, '_blank');
  win.focus();
}
