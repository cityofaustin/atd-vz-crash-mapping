# atd-vz-crash-mapping

This is a small collection of software and scripts which can be used to create crash diagrams purpose built for the Austin Transportation Department's Vision Zero group.

## What this is?

This is a docker stack which includes three containers. They are:

1) A database, running PostgreSQL with the postGIS extension. There are scripts to load a database on this server with the latest backup of the Vision Zero data and augment it with tables used for crash diagramming.
2) A webserver, running Apache to provide static image assets and to execute a Perl script exposed via a CGI. 
3) A utility server, which is used to execute scripts that play a part of the diagramming process.

## How do you use it?

1) Create a `.env` which is to reside in the root of the repository. It will be ignored by the `.gitignore` file. This file holds secrets. There is a template file named `.env_template`.
2) Get the 3 images running. This may be possible via the Docker desktop application, or you can use an available terminal to 1) change directories to the root of the repository, 2) run `docker-compose -f ./docker-compose.yml -f docker-compose.x86_64.yml up;`.
3) Start the webserver and web app.
    1) Either use the `CLI` button on docker desktop on the webserver container or `docker exec -it crash_mapping_webserver bash;` and then you'll be dumped into a shell on the webserver. Run `bash` if needed. `apachectl start` to start the apache process. `apachectl restart` can be used if you find that the CGI endpoint is not responding. `yarn run dev` will then start the JS mapping application. Leave this terminal spinning.
4) Open a utility terminal. Use the utility container `CLI` button or `docker exec -it crash_mapping_utilities bash;` 
5) Execute `pull_vz_backup_populate_local_db.sh;`. This should backup the local diagramming data, drop the database, download the latest backup, rebuild the database, restore the diagramming data. This is a non-trivial disk operation and can take a while.
    1) The previous steps are all that are required to provide the user a copy of the VZ database with full administrative rights local to their machine. This can be used for analysis other reasons. The database is available on localhost on port 5432. The username and password are set in the `.env` file you must create in the root of your checkout.
6) Start QGIS and open your latest project file.
7) In the layer which points at your local `AOI (Entire diagram extents)` table, create a new feature which defines the whole intersection, containing any crashes of interest, which you wish to diagram. Be liberal in the extents; include sidewalks and driveways which have crashes on them. Any crash outside of this feature will not be considered during the rest of this process. Give the polygon a reasonable value for the 'Name' attribute when saving it. Toggle out of editing mode and note the ID of the new AOI created using the feature inspect tool.
8) Open a database client and navigate to a query window so that you can execute SQL queries against the `atd_vz_database`. This database server should be available at `localhost` on port `5432`. The username and password are available in the `.env` file created in the first step.
9) Execute the following query. Additional columns can be added to suite the needs of person doing crash QA/QC. Be sure to substitute in the ID of the feature you created:
```
select crashes.crash_id, crashes.crash_date
from atd_txdot_crashes crashes
join diagram_aoi aoi on ( 1 = 1
    and aoi.id = <AOI FEATURE ID>
    and aoi.geometry && crashes.position
    and ST_Contains(aoi.geometry, crashes.position)
    ) 
```
10) Export these results out as a CSV file. Open this file, and use the following excel formula to create a list of hyperlinks to the Vision Zero Editor (VZE), one for each crash: `=HYPERLINK(CONCAT("https://visionzero.austin.gov/editor/#/crashes/",A1), A1)`
11) Visit each crash in the VZE and geolocate the crash as accurately as possible. If needed, maintain a list of crash IDs which will need to be excluded from this crash diagram.
12) Return to your shell on the utility container or open another. Execute `sync_locations_from_vzdb_to_diagrams.pl;` to pull all geolocated crash locations from the VZDB to your local copy.
13) Visit http://localhost:1234?aoi=<AOI_ID>, being sure to substitute in the ID of the area of interest created above.
14) Zoom and pan the map to cover the approximate extent of the area of interest, erring on the side of being slight too zoomed out. Note: the AOI shapes are not drawn on the map.
15) Click the `Draw Shape` button. Crashes outside the area of interest should no longer be visible on the map, leaving only crashes which are contained by the area of interest and within the time frame specified at the top of the tool. 
16) Click the `Diagram` button. Crashes should transform from a point symbol to a crash diagramming symbol. They should be colored by injury severity. 
17) Move, rotate and change symbols of each crash into the location you would like them to appear on the map.
18) Return to the QGIS application and turn on the `Mapped crashes with diagram symbology` layer. You should see the same diagram symbols that you assigned for each crash in the correct location. 
19) Copy the AOI feature for this location to the clipboard. Turn on and edit the `Approaches` layer and paste in this feature as a new entry.
20) Utilize the `Split Features` tool in the `Advanced Digitizing Toolbar` to split this feature up into logical approaches. Diagram inset tables will be computed per approach. The area covered by the approaches should cover exactly the area of covered by the area of interest without overlapping each other.
21) Return to the database client, and execute the following queries:
```
refresh materialized view diagram_aoi_with_labels;
refresh materialized view diagram_intersections_with_labels;
```
22) Return to QGIS after the above queries have completed and turn off the `AOI (Entire Diagram extents)` and `Approaches` layer. In the `Crash Diagrams` group, turn on `AOI (Dashed Outlines)`. 
23) Open the QGIS map layout tool. Add a new US Letter head page and remove the default A4 page. Choose portrait or landscape based on the general aspect ratio of the AOI being mapped. Choose an appropriate map rotation to best fit the AOI to the map.
24) Add the basic map components as desired generally including:
    1)  North arrow
    2)  Scale bar
    3)  Title including dates drawn from the web application
25) Select the map object and `Lock layers` and `Lock styles for layers` so that the dashed AOI outline is visible with crash diagram symbols shown for crashes. 
26) Return to the primary QGIS window and use the feature inspection tool to look for the `overview_table` attribute on the AOI layer named `AOI (Dashed Outlines)`. Copy this attribute value.
27) On the layout page, add a new text box in an open area of the map and paste in this value. Select `Render as HTML`. 
28) In the main QGIS window, turn off the `AOI (Dashed Outlines)` layer and turn on the `Approaches (With table attribute)` layer. 
29) For each approach, use the inspection tool to copy the attribute `approach_table`. Returning to the layout window, create a new text box for each approach and paste in the `approach_table` attribute, clicking `Render as HTML`. Arrange these inset tables near the clusters of crashes which they represent.
30) For the above steps, depending on the extent size of the AOI, it may be needed to add additional pages for approaches or groups of approaches. The driving consideration for the addition of new pages is the relative scale of the crash symbols to the viewport of the map. If they are not sufficiently large to be useful, additional pages at tighter zoom levels are needed.
31) When the layout is complete, render the map or maps out as a PDF document. Close the QGIS layout tool.
32) Save 3 shapefiles out to disk:
    1)  `Mapped Crashes with diagram symbology` as `crashes`
    2)  `AOI (Dashed outlines)` as `aoi`
    3)  `Approaches (With table attribute)` as `intersections`
33) Open ArcGIS Pro, load these shapefiles, an update the AGOL resource which is used to provide a locator map linking symbols to crash IDs.
34) 
## Useful commands

* `vim Makefile;` Read common recipes 
### Substitute architecture specific YAML file as needed
* Build images for X86: `docker-compose -f ./docker-compose.yml -f docker-compose.x86-64.yml build;`
* Start containers: `docker-compose -f ./docker-compose.yml -f docker-compose.x86-64.yml up -d;`
* Stop containers: `docker-compose -f ./docker-compose.yml -f docker-compose.x86-64.yml stop;`
* Open shell on utility container: `docker exec -it crash_mapping_utilities bash;`
* Open `psql` on database in `atd_vz_data` database: `docker exec -it crash_mapping_database psql -U crash_mapping atd_vz_data;`
* On utility container, open `psql`: `psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB;`
* Start JS app: `npm run dev;`

## Considerations
* The VZDB data can be downloaded fresh anytime, but this docker stack will contain the actual diagramming work and data. Considerations for backups?
