# atd-vz-crash-mapping

This is a small collection of software and scripts which can be used to create crash diagrams purpose built for the Austin Transportation Department's Vision Zero group.

## What this is?

This is a docker stack which includes three containers. They are:

1) A database, running PostgreSQL with the postGIS extension. There are scripts to load a database on this server with the latest backup of the Vision Zero data and augment it with tables used for crash diagramming.
2) A webserver, running Apache to provide static image assets and to execute a Perl script exposed via a CGI. 
3) A utility server, which is used to execute scripts that play a part of the diagramming process.

## What is the big picture?

## How do you use it?


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