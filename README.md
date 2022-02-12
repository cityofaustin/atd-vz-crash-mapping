# atd-vz-crash-mapping

This is a small collection of software and scripts which can be used to create crash diagrams purpose built for the Austin Transportation Department's Vision Zero group.

## What this is?

This is a docker stack which includes three containers. They are:

1) A database, running PostgreSQL with the postGIS extension. There are scripts to load a database on this server with the latest backup of the Vision Zero data and augment it with tables used for crash diagramming.
2) A webserver, running Apache to provide static image assets and to execute a Perl script exposed via a CGI. 
3) A utility server, which is used to execute scripts that play a part of the diagramming process.

## How do you use it?

1) Create a `.env` which is to reside in the root of the repository. It will be ignored by the `.gitignore` file. This file holds secrets. There is a template file named `.env_template`.
1) Get the 3 images running. This may be possible via the Docker desktop application, or you can use an available terminal to 1) change directories to the root of the repository, 2) run `docker-compose -f ./docker-compose.yml -f docker-compose.x86_64.yml up;`.
1) Start the webserver and web app.
    1) Either use the `CLI` button on docker desktop on the webserver container or `docker exec -it crash_mapping_webserver bash;` and then you'll be dumped into a shell on the webserver. Run `bash` if needed. `apachectl start` to start the apache process. `apachectl restart` can be used if you find that the CGI endpoint is not responding. `yarn run dev` will then start the JS mapping application. Leave this terminal spinning.
1) Open a utility terminal. Use the database `CLI` button or `docker exec -it crash_mapping_utilities bash;` 
1) Execute `pull_vz_backup_populate_local_db.sh`. This should backup the local diagramming data, drop the database, download the latest backup, rebuild the database, restore the diagramming data.
    1) The previous steps are all that are required to provide the user a copy of the VZ database with full administrative rights local to their machine. This can be used for analysis other reasons. The database is available on localhost on port 5432. The username and password are set in the `.env` file you must create in the root of your checkout.
1) Start QGIS and open your latest project file.
1) In the layer which points at your local `AOI` `table`, create a new feature which defines the whole intersection, containing any crashes of interest, which you wish to diagram. Be liberal in the extents, include sidewalks and driveways which have crashes on them. Any crash outside of this feature will not be considered during the rest of this process.


## Useful commands
### Substitute architecture specific YAML file as needed
* Build images for X86: `docker-compose -f ./docker-compose.yml -f docker-compose.x86-64.yml build`
* Start containers: `docker-compose -f ./docker-compose.yml -f docker-compose.x86-64.yml up -d`
* Stop containers: `docker-compose -f ./docker-compose.yml -f docker-compose.x86-64.yml stop`
* Open shell on utility container: `docker exec -it crash_mapping_utilities bash`
* Open `psql` on database in `atd_vz_data` database: `docker exec -it crash_mapping_database psql -U crash_mapping atd_vz_data`
* On utility container, open `psql`: `psql -U $POSTGRES_USER -h $POSTGRES_HOSTNAME $POSTGRES_DB`
* Start JS app: `npm run dev`

## Considerations
* The VZDB data can be downloaded fresh anytime, but this docker stack will contain the actual diagramming work and data. Considerations for backups?